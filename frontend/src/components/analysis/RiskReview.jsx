import React, { useMemo } from 'react';
import { FileWarning, MessageSquareWarning } from 'lucide-react';
import { useContractStore } from '../../store/useContractStore';
import { SectionCard, EmptyState, InlineNotice } from '../ui/states';
import { SeverityBadge, DemoBadge, Badge } from '../ui/badges';
import { severitySortKey } from './utils';
import AnalysisErrorBanner from './AnalysisErrorBanner';

export default function RiskReview() {
  const { flags, obligations, analysisErrors, aiDemoMode, setActiveTab } = useContractStore();

  const sorted = useMemo(() => [...(flags || [])].sort((a, b) => severitySortKey(a) - severitySortKey(b)), [flags]);

  if (analysisErrors?.flags) {
    return (
      <div className="space-y-5">
        <AnalysisErrorBanner category="flags" />
      </div>
    );
  }

  if (!flags || flags.length === 0) {
    return (
      <EmptyState
        icon={FileWarning}
        title="No risk items flagged"
        message="No unusual or risky terms were identified in the analyzed text. Check this contract manually if it contains unusual commercial terms that were not detected."
        action={
          <button
            onClick={() => setActiveTab('overview')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold shadow"
          >
            Back to overview
          </button>
        }
      />
    );
  }

  const counts = sorted.reduce((acc, f) => {
    const k = String(f.severity || 'medium').toLowerCase();
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white">Risk Review</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {sorted.length} flagged {sorted.length === 1 ? 'item' : 'items'} ·{' '}
            {Object.entries(counts)
              .sort((a, b) => severitySortKey({ severity: a[0] }) - severitySortKey({ severity: b[0] }))
              .map(([k, n]) => `${n} ${k}`)
              .join(' · ')}
          </p>
        </div>
        {aiDemoMode && <DemoBadge />}
      </div>

      {aiDemoMode && (
        <InlineNotice tone="indigo">
          This is sample demo data. Configure a Gemini API key in the backend to analyze the real uploaded document.
        </InlineNotice>
      )}

      <div className="space-y-3.5">
        {sorted.map((f, i) => {
          const colors =
            f.severity === 'High' || f.severity === 'Critical' || f.severity === 'high' || f.severity === 'critical'
              ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
              : f.severity === 'Medium' || f.severity === 'medium'
              ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
              : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50';
          return (
            <SectionCard key={i} className="!p-0 overflow-hidden">
              <div className="flex items-start gap-3 p-4 sm:p-5">
                <div className={`p-2 rounded-xl border ${colors} flex-shrink-0`}>
                  <MessageSquareWarning className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{f.title || 'Flagged clause'}</h4>
                    <SeverityBadge severity={f.severity} />
                  </div>

                  {f.clause_text && (
                    <blockquote className="mt-2.5 border-l-2 border-zinc-300 dark:border-zinc-700 pl-3 text-xs italic leading-relaxed text-zinc-500 dark:text-zinc-400">
                      "{f.clause_text}"
                    </blockquote>
                  )}

                  {f.reason && (
                    <p className="mt-2.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">{f.reason}</p>
                  )}

                  {(f.business_impact || f.review_consideration) && (
                    <div className="mt-3 grid sm:grid-cols-2 gap-2.5">
                      {f.business_impact && (
                        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-[#27272A] p-3">
                          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 block mb-1">BUSINESS IMPACT</span>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">{f.business_impact}</p>
                        </div>
                      )}
                      {f.review_consideration && (
                        <div className="rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 p-3">
                          <span className="text-[10px] font-mono text-brand-indigo dark:text-indigo-400 block mb-1">REVIEW CONSIDERATION</span>
                          <p className="text-[11px] text-indigo-900 dark:text-indigo-200 leading-relaxed">{f.review_consideration}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {f.suggested_revision && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
                      <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 block mb-1 font-bold">RECOMMENDED REDLINE REVISION</span>
                      <p className="text-[11px] font-mono text-emerald-900 dark:text-emerald-200 italic leading-relaxed">
                        &quot;{f.suggested_revision}&quot;
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2 flex-wrap text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                    {f.flag_type ? <Badge tone="rose">{f.flag_type}</Badge> : null}
                    {f.affected_party ? <Badge tone="zinc">Impacts: {f.affected_party}</Badge> : null}
                    {f.section_reference ? <Badge tone="zinc">§ {f.section_reference}</Badge> : null}
                    {f.page_reference ? <Badge tone="zinc">p. {f.page_reference}</Badge> : null}
                  </div>
                </div>
              </div>
            </SectionCard>
          );
        })}
      </div>

      {obligations && obligations.length > 0 && (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
          Cross-reference: {obligations.length} obligation{obligations.length === 1 ? '' : 's'} extracted —{' '}
          <button onClick={() => setActiveTab('obligations')} className="text-brand-indigo hover:underline font-semibold inline">
            open the obligor workspace
          </button>
          .
        </p>
      )}
    </div>
  );
}