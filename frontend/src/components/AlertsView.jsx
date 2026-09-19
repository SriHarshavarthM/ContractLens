import React from 'react';
import { useContractStore } from '../store/useContractStore';
import {
  Bell,
  Clock,
  AlertTriangle,
  Calendar,
  Building2,
  CheckCircle2,
  Info,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function AlertsView() {
  const { alerts, obligations, setActiveTab } = useContractStore();

  const alertItems = alerts?.alerts || [];

  if (alertItems.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center">
        <Bell className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">No Impending Deadlines</h3>
        <p className="text-xs text-slate-400">
          No obligations are due within the next 30 days.
        </p>
      </div>
    );
  }

  const due7 = alertItems.filter((a) => a.days_remaining <= 7);
  const due14 = alertItems.filter((a) => a.days_remaining > 7 && a.days_remaining <= 14);
  const due30 = alertItems.filter((a) => a.days_remaining > 14 && a.days_remaining <= 30);
  const upcoming = alertItems.filter((a) => a.days_remaining > 30);

  const renderAlertCard = (item, idx, bucketColor) => {
    return (
      <div
        key={idx}
        className="glass-card p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                item.days_remaining <= 7
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : item.days_remaining <= 14
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}
            >
              {item.urgency || 'High'} Urgency
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Party: <strong className="text-white">{item.party}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs font-mono text-slate-300">
              Due Date: <strong className="text-white">{item.deadline}</strong>
            </div>
            <span
              className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg ${
                item.days_remaining <= 7
                  ? 'bg-rose-500 text-white animate-pulse'
                  : item.days_remaining <= 14
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              }`}
            >
              {item.days_remaining <= 0 ? 'DUE TODAY' : `${item.days_remaining} DAYS REMAINING`}
            </span>
          </div>
        </div>

        <p className="text-sm font-semibold text-slate-100 leading-relaxed">
          {item.obligation}
        </p>

        {item.source_clause && (
          <div className="p-2.5 rounded-lg bg-navy-950 border border-white/5 text-[11px] font-mono text-slate-400">
            {item.source_clause}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Proactive Alert Monitor
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Critical Deadline Watchlist</h2>
          <p className="text-xs text-slate-400">
            Proactive early-warning system for pending delivery deadlines, SLA reconciliations, and penalty triggers.
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center min-w-[90px]">
            <div className="text-lg font-bold text-rose-400">{due7.length}</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">≤ 7 Days</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center min-w-[90px]">
            <div className="text-lg font-bold text-amber-400">{due14.length}</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">≤ 14 Days</div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center min-w-[90px]">
            <div className="text-lg font-bold text-indigo-400">{due30.length}</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">≤ 30 Days</div>
          </div>
        </div>
      </div>

      {/* 7-Day Bucket */}
      {due7.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Imminent Action Required (Due in ≤ 7 Days)</span>
          </div>
          <div className="space-y-3">
            {due7.map((item, idx) => renderAlertCard(item, idx, 'rose'))}
          </div>
        </div>
      )}

      {/* 14-Day Bucket */}
      {due14.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>High Priority (Due in 8 to 14 Days)</span>
          </div>
          <div className="space-y-3">
            {due14.map((item, idx) => renderAlertCard(item, idx, 'amber'))}
          </div>
        </div>
      )}

      {/* 30-Day Bucket */}
      {due30.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Upcoming Milestones (Due in 15 to 30 Days)</span>
          </div>
          <div className="space-y-3">
            {due30.map((item, idx) => renderAlertCard(item, idx, 'indigo'))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-500 pr-2">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span>Powered by Gemini 1.5 Pro Proactive Engine</span>
      </div>
    </div>
  );
}
