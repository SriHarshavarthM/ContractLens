import React from 'react';
import { FileText, CalendarClock, AlertTriangle, CheckCircle2, Smartphone } from 'lucide-react';
import { useContractStore } from '../../store/useContractStore';
import { SectionCard, EmptyState, InlineNotice } from '../ui/states';
import { UrgencyBadge, DemoBadge } from '../ui/badges';
import { deadlineLabel, formatDateShort } from './utils';
import AnalysisErrorBanner from './AnalysisErrorBanner';

export default function DocumentSummary() {
  const { summary, alerts, analysisErrors, aiDemoMode, contractError } = useContractStore();

  const summaryFailed = !!analysisErrors?.summary;
  const alertsFailed = !!analysisErrors?.alerts;

  if ((summaryFailed || alertsFailed) && !summary && !alerts?.alerts?.length) {
    return (
      <div className="space-y-5">
        {summaryFailed && <AnalysisErrorBanner category="summary" />}
        {alertsFailed && <AnalysisErrorBanner category="alerts" />}
      </div>
    );
  }

  if (!summary && !alerts?.alerts?.length) {
    return (
      <EmptyState
        icon={FileText}
        title="Summary not available"
        message="The executive summary and deadline alerts are generated in the second analysis batch and are persisted per contract. Re-run the analysis if this view is empty."
      />
    );
  }

  const alertList = alerts?.alerts || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white">Summary & Alerts</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {summary?.headline ? 'Executive-level readout and upcoming deadlines' : `${alertList.length} deadline ${alertList.length === 1 ? 'alert' : 'alerts'}`}
          </p>
        </div>
        {aiDemoMode && <DemoBadge />}
      </div>

      {summaryFailed && <AnalysisErrorBanner category="summary" />}
      {alertsFailed && <AnalysisErrorBanner category="alerts" />}

      {aiDemoMode && (
        <InlineNotice tone="indigo">
          This view is showing sample demo data. Configure a Gemini API key in the backend to generate the summary from
          the uploaded document.
        </InlineNotice>
      )}

      {summary && (
        <SectionCard title="Executive Summary" icon={FileText}>
          {summary.headline && (
            <blockquote className="border-l-2 border-brand-indigo pl-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
              "{summary.headline}"
            </blockquote>
          )}
          {summary.overview && <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{summary.overview}</p>}
          {summary.parties_summary && (
            <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{summary.parties_summary}</p>
          )}

          {(summary.financial_summary || summary.financial_terms) && (
            <div className="mt-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-3.5">
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block mb-1">COMMERCIAL &amp; FINANCIAL STRUCTURE</span>
              <p className="text-xs leading-relaxed text-emerald-900 dark:text-emerald-200 font-medium">
                {summary.financial_summary || summary.financial_terms}
              </p>
            </div>
          )}

          {(summary.what_we_get || summary.what_we_owe) && (
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              {summary.what_we_get && (
                <div className="rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-3.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 block mb-1">WHAT WE GET (ENTITLEMENTS)</span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">{summary.what_we_get}</p>
                </div>
              )}
              {summary.what_we_owe && (
                <div className="rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 p-3.5">
                  <span className="text-[10px] font-mono font-bold text-brand-indigo dark:text-indigo-400 block mb-1">WHAT WE OWE (OBLIGATIONS)</span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">{summary.what_we_owe}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            {(summary.key_commitments || []).length > 0 && (
              <div>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block font-medium mb-1.5">Key commitments</span>
                <ul className="space-y-1.5">
                  {summary.key_commitments.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(summary.critical_dates || []).length > 0 && (
              <div>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block font-medium mb-1.5">Critical dates</span>
                <ul className="space-y-1.5">
                  {summary.critical_dates.map((d, i) => {
                    const rel = deadlineLabel(d);
                    return (
                      <li key={i} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                        <CalendarClock className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <span>{formatDateShort(d) || d}</span>
                        {rel && (
                          <span className={`text-[11px] font-semibold ${rel.tone === 'rose' ? 'text-rose-600 dark:text-rose-400' : rel.tone === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                            {rel.text}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {(summary.risk_highlights || []).length > 0 && (
            <div className="mt-4">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block font-medium mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Risk highlights
              </span>
              <ul className="space-y-1.5">
                {summary.risk_highlights.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(summary.recommended_actions || []).length > 0 && (
            <div className="mt-4 p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50">
              <span className="text-[10px] font-mono text-brand-indigo dark:text-indigo-400 block mb-1.5">RECOMMENDED ACTIONS</span>
              <ul className="space-y-1.5">
                {summary.recommended_actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-indigo-900 dark:text-indigo-200">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-brand-indigo flex-shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>
      )}

      {alertList.length > 0 && (
        <SectionCard title="Deadline Alerts" subtitle="Proactive compliance alerts from the agreement" icon={Smartphone}>
          <div className="space-y-2.5">
            {alertList.map((al, i) => {
              const rel = al.deadline ? deadlineLabel(al.deadline) : null;
              return (
                <div key={i} className="rounded-xl border border-zinc-200 dark:border-[#27272A] p-3.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">{al.obligation}</span>
                    <UrgencyBadge urgency={al.urgency} />
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-[11px] text-zinc-500 dark:text-zinc-400">
                    {al.deadline && <span className="font-mono font-semibold">{formatDateShort(al.deadline)}</span>}
                    {al.deadline && rel && (
                      <span className={`font-bold ${rel.tone === 'rose' ? 'text-rose-600 dark:text-rose-400' : rel.tone === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                        {rel.text}
                      </span>
                    )}
                    {typeof al.days_remaining === 'number' && al.deadline && (
                      <span className="font-mono">{al.days_remaining} days</span>
                    )}
                    {al.party ? <span>{al.party}</span> : null}
                  </div>
                  {al.source_clause && (
                    <p className="mt-1.5 text-[11px] italic text-zinc-400 dark:text-zinc-500">「{al.source_clause}」</p>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {contractError && (
        <p className="text-[11px] text-rose-500">{contractError}</p>
      )}
    </div>
  );
}