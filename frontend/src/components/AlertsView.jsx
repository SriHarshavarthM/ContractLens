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
        className="bg-white dark:bg-[#121215] p-5 rounded-2xl border border-zinc-200 dark:border-[#27272A] hover:border-brand-indigo transition-all space-y-3 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                item.days_remaining <= 7
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  : item.days_remaining <= 14
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-brand-indigo border-indigo-200 dark:border-indigo-800'
              }`}
            >
              {item.urgency || 'High'} Urgency
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              Party: <strong className="text-zinc-800 dark:text-zinc-200">{item.party}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
              Due Date: <strong className="text-zinc-900 dark:text-white">{item.deadline}</strong>
            </div>
            <span
              className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg ${
                item.days_remaining <= 7
                  ? 'bg-rose-600 text-white animate-pulse'
                  : item.days_remaining <= 14
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'bg-indigo-100 dark:bg-indigo-950/60 text-brand-indigo border border-indigo-200 dark:border-indigo-800'
              }`}
            >
              {item.days_remaining <= 0 ? 'DUE TODAY' : `${item.days_remaining} DAYS REMAINING`}
            </span>
          </div>
        </div>

        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-relaxed">
          {item.obligation}
        </p>

        {item.source_clause && (
          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            {item.source_clause}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-[#121215] p-6 rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Proactive Alert Monitor
            </span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Critical Deadline Watchlist</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Proactive early-warning system for pending delivery deadlines, SLA reconciliations, and penalty triggers.
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center min-w-[90px]">
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400">{due7.length}</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">≤ 7 Days</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center min-w-[90px]">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{due14.length}</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">≤ 14 Days</div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center min-w-[90px]">
            <div className="text-lg font-bold text-brand-indigo">{due30.length}</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">≤ 30 Days</div>
          </div>
        </div>
      </div>

      {/* 7-Day Bucket */}
      {due7.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
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
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4 text-amber-500" />
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
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-indigo">
            <Calendar className="w-4 h-4 text-brand-indigo" />
            <span>Upcoming Milestones (Due in 15 to 30 Days)</span>
          </div>
          <div className="space-y-3">
            {due30.map((item, idx) => renderAlertCard(item, idx, 'indigo'))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 pr-2">
        <Sparkles className="w-3 h-3 text-brand-indigo" />
        <span>Powered by Gemini 1.5 Pro Proactive Engine</span>
      </div>
    </div>
  );
}
