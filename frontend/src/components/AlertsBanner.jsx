import React, { useState } from 'react';
import { useContractStore } from '../store/useContractStore';
import {
  Bell,
  AlertTriangle,
  Clock,
  ChevronRight,
  X,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function AlertsBanner() {
  const { alerts, activeTab, setActiveTab } = useContractStore();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !alerts || !alerts.alerts || alerts.alerts.length === 0) {
    return null;
  }

  const alertItems = alerts.alerts || [];
  const due7 = alerts.due_within_7_days || alertItems.filter((a) => a.days_remaining <= 7).length;
  const due14 = alerts.due_within_14_days || alertItems.filter((a) => a.days_remaining <= 14).length;
  const due30 = alerts.due_within_30_days || alertItems.filter((a) => a.days_remaining <= 30).length;

  const urgentCount = due14 > 0 ? due14 : due30;
  const timeframeText = due14 > 0 ? 'the next 14 days' : 'the next 30 days';

  // Highlight most pressing alert
  const topAlert = alertItems[0];

  return (
    <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 border-b border-amber-500/30 px-4 py-2.5 relative z-50 text-xs text-slate-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left message with flashing indicator */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Proactive Deadline Alert:</span>
            </div>
          </div>

          <span className="text-slate-200">
            <strong className="text-white font-bold">{urgentCount} obligation{urgentCount === 1 ? '' : 's'}</strong> due in {timeframeText}.
          </span>

          {topAlert && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-slate-300 text-[11px] font-mono">
              Next: <strong className="text-amber-300">{topAlert.obligation}</strong> ({topAlert.days_remaining}d remaining)
            </span>
          )}
        </div>

        {/* Right CTA and Dismiss */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={() => setActiveTab('alerts')}
            className="flex items-center gap-1 text-xs font-semibold text-brand-indigo hover:text-indigo-300 transition-colors"
          >
            <span>View All Alerts ({alertItems.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
            title="Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
