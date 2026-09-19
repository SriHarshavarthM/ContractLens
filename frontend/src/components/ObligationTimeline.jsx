import React, { useState } from 'react';
import { useContractStore } from '../store/useContractStore';
import {
  Clock,
  Calendar,
  AlertCircle,
  CreditCard,
  RefreshCw,
  Ban,
  FileCheck,
  CheckCircle2,
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react';

export default function ObligationTimeline() {
  const { timeline } = useContractStore();
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);

  if (!timeline || timeline.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center">
        <Clock className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">No Timeline Events Extracted</h3>
        <p className="text-xs text-slate-400">Upload a contract to view chronological obligations.</p>
      </div>
    );
  }

  // Calculate days from today
  const today = new Date();
  const enhancedTimeline = timeline.map((item, idx) => {
    let daysDiff = null;
    if (item.date) {
      try {
        const itemDate = new Date(item.date);
        const diffTime = itemDate - today;
        daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } catch (e) {
        daysDiff = null;
      }
    }
    return {
      ...item,
      daysDiff,
      isNearTerm: daysDiff !== null && daysDiff >= 0 && daysDiff <= 30,
      isCritical: daysDiff !== null && daysDiff >= 0 && daysDiff <= 7,
    };
  });

  const selectedItem = enhancedTimeline[selectedNodeIndex] || enhancedTimeline[0];

  const getTypeIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'payment') return CreditCard;
    if (t === 'renewal') return RefreshCw;
    if (t === 'termination') return Ban;
    if (t === 'deadline') return AlertCircle;
    return FileCheck;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-indigo/20 text-indigo-300 border border-indigo-500/30">
              Chronological Roadmap ({enhancedTimeline.length} Events)
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Contractual Deadline Timeline</h2>
          <p className="text-xs text-slate-400">
            Click any milestone node to view full clause parameters, associated party, and penalties.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
            <span>Due ≤ 7 Days</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Due ≤ 30 Days</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <span>Standard Milestone</span>
          </div>
        </div>
      </div>

      {/* Horizontal Flexbox Timeline View */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 overflow-x-auto pb-8">
        <div className="relative min-w-[760px] flex items-center justify-between pt-6 pb-2 px-6">
          {/* Continuous baseline connector track */}
          <div className="absolute top-1/2 left-8 right-8 h-1 bg-navy-800 -translate-y-1/2 z-0">
            <div className="h-full bg-gradient-to-r from-brand-indigo via-cyan-400 to-indigo-600 rounded-full opacity-60" />
          </div>

          {/* Timeline Nodes */}
          {enhancedTimeline.map((item, idx) => {
            const Icon = getTypeIcon(item.type);
            const isSelected = selectedNodeIndex === idx;

            return (
              <div
                key={idx}
                onClick={() => setSelectedNodeIndex(idx)}
                className="relative z-10 flex flex-col items-center cursor-pointer group"
                style={{ flex: 1 }}
              >
                {/* Top Date Stamp */}
                <div
                  className={`text-xs font-mono mb-3 px-2 py-0.5 rounded transition-all ${
                    isSelected
                      ? 'bg-brand-indigo text-white font-bold scale-105 shadow-md shadow-indigo-500/30'
                      : item.isCritical
                      ? 'text-rose-400 font-semibold'
                      : item.isNearTerm
                      ? 'text-amber-400 font-semibold'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {item.date || 'TBD'}
                </div>

                {/* Center Node Circle with Pulsing Urgency Indicator */}
                <div className="relative flex items-center justify-center">
                  {/* Pulsing indicator for deadlines within 30 days */}
                  {item.isNearTerm && (
                    <span
                      className={`absolute w-12 h-12 rounded-full animate-ping opacity-40 ${
                        item.isCritical ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                    />
                  )}

                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isSelected
                        ? 'bg-brand-indigo text-white scale-125 shadow-xl shadow-indigo-500/50 ring-4 ring-indigo-500/30'
                        : item.isCritical
                        ? 'bg-rose-500/20 text-rose-300 border-2 border-rose-500'
                        : item.isNearTerm
                        ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-500'
                        : 'bg-navy-900 text-indigo-400 border border-white/20 group-hover:border-indigo-400 group-hover:scale-110'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                {/* Bottom Node Title */}
                <div className="mt-3 text-center max-w-[130px]">
                  <p
                    className={`text-xs font-semibold line-clamp-2 transition-colors ${
                      isSelected
                        ? 'text-white font-bold'
                        : item.isCritical
                        ? 'text-rose-300'
                        : item.isNearTerm
                        ? 'text-amber-300'
                        : 'text-slate-300 group-hover:text-white'
                    }`}
                  >
                    {item.label}
                  </p>
                  {item.daysDiff !== null && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded mt-1 inline-block ${
                        item.daysDiff <= 7
                          ? 'bg-rose-500/20 text-rose-300'
                          : item.daysDiff <= 30
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-navy-800 text-slate-400'
                      }`}
                    >
                      {item.daysDiff <= 0 ? 'Due Today' : `in ${item.daysDiff}d`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Node Details Card */}
      {selectedItem && (
        <div className="glass-card p-6 rounded-2xl border border-indigo-500/30 bg-navy-900/90 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-indigo/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl border ${
                  selectedItem.isCritical
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : selectedItem.isNearTerm
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/10 text-slate-300 mr-2">
                  {selectedItem.type || 'Milestone'}
                </span>
                <h3 className="text-lg font-bold text-white inline-block">
                  {selectedItem.label}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Party Responsible: <strong className="text-white">{selectedItem.party || 'All Parties'}</strong>
                </p>
              </div>
            </div>

            {/* Proximity / Days Remaining Badge */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-mono">Date Scheduled</span>
                <span className="text-sm font-bold text-white font-mono">{selectedItem.date}</span>
              </div>
              {selectedItem.daysDiff !== null && (
                <div
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono ${
                    selectedItem.isCritical
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : selectedItem.isNearTerm
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  }`}
                >
                  {selectedItem.daysDiff <= 0 ? 'ACTION REQUIRED TODAY' : `${selectedItem.daysDiff} DAYS REMAINING`}
                </div>
              )}
            </div>
          </div>

          {/* Description & Source Clause */}
          <div className="mt-4 space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Milestone Description
              </h4>
              <p className="text-sm text-slate-200 leading-relaxed">
                {selectedItem.description}
              </p>
            </div>

            {selectedItem.source_clause && (
              <div className="p-3 rounded-xl bg-navy-950/80 border border-white/5">
                <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5 mb-1">
                  <Info className="w-3.5 h-3.5" />
                  Contract Citation
                </span>
                <p className="text-xs font-mono text-slate-300">
                  {selectedItem.source_clause}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-500 pr-2">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span>Powered by Gemini 1.5 Pro</span>
      </div>
    </div>
  );
}
