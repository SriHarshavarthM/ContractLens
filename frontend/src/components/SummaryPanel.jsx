import React from 'react';
import { useContractStore } from '../store/useContractStore';
import {
  Sparkles,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';

export default function SummaryPanel() {
  const { summary, activeContractId, contracts } = useContractStore();

  const activeContract = contracts.find((c) => c.id === activeContractId);

  if (!summary) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center">
        <Sparkles className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">No Executive Summary Available</h3>
        <p className="text-xs text-slate-400">Analyze an agreement to generate executive highlights.</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              C-Suite Intelligence Brief
            </span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Executive Contract Summary</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Synthesized key commitments, critical timelines, financial exposures, and recommended action points.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2.5 rounded-xl bg-brand-indigo hover:bg-indigo-600 text-white font-semibold text-xs shadow-sm flex items-center gap-2 transition-all flex-shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>Download as PDF / Print</span>
        </button>
      </div>

      {/* Printable Executive Card */}
      <div className="print-area p-8 lg:p-10 rounded-2xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121215] shadow-sm space-y-8">
        {/* Document Header */}
        <div className="border-b border-zinc-100 dark:border-[#27272A] pb-6">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-[11px] uppercase font-bold tracking-widest text-brand-indigo">
              CONTRACTLENS EXECUTIVE REPORT
            </span>
            <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
              Generated {new Date().toLocaleDateString()}
            </span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
            {summary.headline || 'Enterprise Agreement Executive Summary'}
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
            Parties: <span className="text-zinc-900 dark:text-white font-semibold">{summary.parties_summary}</span>
          </p>
        </div>

        {/* Commercial & Financial Terms Overview */}
        <div className="p-5 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <DollarSign className="w-4 h-4" />
            <span>Financial Terms & Commercial Structure</span>
          </div>
          <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed">
            {summary.financial_terms || 'Standard subscription fee structure.'}
          </p>
        </div>

        {/* Two Column Grid: Key Commitments & Critical Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Commitments */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Key Commitments & Deliverables</span>
            </div>
            <ul className="space-y-2.5">
              {(summary.key_commitments || []).map((c, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <span className="leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Critical Dates & Deadlines */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              <Calendar className="w-4 h-4" />
              <span>Critical Milestones & Dates</span>
            </div>
            <ul className="space-y-2.5">
              {(summary.critical_dates || []).map((d, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                  <span className="leading-relaxed">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Risk Highlights */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Identified Risk Exposure Highlights</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {(summary.risk_highlights || []).map((r, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 leading-relaxed font-medium"
              >
                {r}
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-indigo">
            <ShieldCheck className="w-4 h-4" />
            <span>Recommended Strategic Next Steps</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {(summary.recommended_actions || []).map((act, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-zinc-800 dark:text-zinc-200 flex items-start gap-2.5"
              >
                <ArrowRight className="w-4 h-4 text-brand-indigo mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed font-medium">{act}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
          <span>Prepared by ContractLens Autonomous Agent</span>
          <span>Confidential — Legal & Business Executive Privileged</span>
        </div>
      </div>
    </div>
  );
}
