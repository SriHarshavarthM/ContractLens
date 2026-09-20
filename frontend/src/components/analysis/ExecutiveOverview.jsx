import React from 'react';
import {
  Scale,
  FileWarning,
  CalendarClock,
  ShieldCheck,
  AlertTriangle,
  ListChecks,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useContractStore } from '../../store/useContractStore';
import { SectionCard, EmptyState, LoadingBlock, ErrorState, InlineNotice, FieldRow, NotProvided } from '../ui/states';
import { Badge, SeverityBadge } from '../ui/badges';
import { formatDateShort, deadlineLabel, severitySortKey, joinNames } from './utils';
import AnalysisErrorBanner from './AnalysisErrorBanner';

function HealthRing({ score, none }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  if (none) {
    return (
      <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-white dark:bg-[#121215] flex items-center justify-center text-center">
          <span className="text-[10px] font-sans font-semibold leading-tight text-zinc-500 dark:text-zinc-400 px-1">
            No risks flagged
          </span>
        </div>
      </div>
    );
  }
  const color = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#f43f5e';
  const offset = c - (score / 100) * c;
  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-zinc-200 dark:text-zinc-800" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-2xl font-black text-zinc-900 dark:text-white">{score}</span>
          <span className="block text-[9px] font-mono text-zinc-400">HEALTH</span>
        </div>
      </div>
    </div>
  );
}

export default function ExecutiveOverview() {
  const {
    activeContractId,
    contracts,
    extractedData,
    summary,
    flags,
    obligations,
    timeline,
    analysisErrors,
    setActiveTab,
    reanalyzeContract,
    isAnalyzing,
    aiDemoMode,
    contractError,
    contractLoading,
    getHealthScore,
  } = useContractStore();

  // Resolved from store slices (the store exposes activeContractId + contracts).
  const activeContract = contracts.find((c) => c.id === activeContractId) || null;

  const hasExtraction = !!extractedData;
  const noneFlagged = !flags || flags.length === 0;
  const score = noneFlagged ? 95 : getHealthScore();

  const topFlags = [...(flags || [])].sort((a, b) => severitySortKey(a) - severitySortKey(b)).slice(0, 3);

  const importantDates = (extractedData?.important_dates || [])
    .map((d) => {
      const date = d.date || d.event_date || '';
      const label = d.label || d.event || d.description || '';
      return { date, label };
    })
    .filter((d) => d.date && d.label);

  const upcomingTimeline = (timeline || [])
    .filter((t) => t.date && deadlineLabel(t.date))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 4);

  const nextObligations = (obligations || [])
    .filter((o) => o.deadline && deadlineLabel(o.deadline))
    .sort((a, b) => (a.deadline < b.deadline ? -1 : 1))
    .slice(0, 4);

  const partyNames = joinNames(extractedData?.parties, 'name');

  const warnings = [];
  if (extractedData?.validation_warning) warnings.push(extractedData.validation_warning);
  if (summary?.validation_warning) warnings.push(summary.validation_warning);

  if (contractLoading) {
    return <LoadingBlock label="Loading saved analysis…" />;
  }

  if (activeContract && !hasExtraction && activeContract.analysis_status === 'pending') {
    return (
      <EmptyState
        icon={Sparkles}
        title="This contract has not been analyzed yet"
        message="Run the AI analysis to extract parties, terms, obligations, deadlines and risk flags directly from the document text."
        action={
          <button
            onClick={() => reanalyzeContract(activeContract.id)}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-indigo hover:bg-indigo-600 text-white text-xs font-semibold shadow disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isAnalyzing ? 'Analyzing…' : 'Analyze now'}
          </button>
        }
      />
    );
  }

  if (activeContract && !hasExtraction && activeContract.analysis_status === 'failed') {
    return (
      <ErrorState
        title="Analysis failed"
        message={contractError || activeContract.analysis_error || 'The analysis pipeline could not complete. Check backend / Gemini configuration and retry.'}
        action={
          <button
            onClick={() => reanalyzeContract(activeContract.id)}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold shadow disabled:opacity-50"
          >
            Retry analysis
          </button>
        }
      />
    );
  }

  if (!hasExtraction) {
    return (
      <EmptyState
        icon={FileWarning}
        title="No analysis data available"
        message="Upload the contract and run the analysis to populate this view."
      />
    );
  }

  const expiringSoon = deadlineLabel(extractedData.expiration_date);

  return (
    <div className="space-y-5">
      {warnings.length > 0 &&
        warnings.map((w, i) => (
          <InlineNotice key={i} tone="amber">
            The model output could not be fully validated: <span className="font-mono">{w}</span>
          </InlineNotice>
        ))}
      {aiDemoMode && (
        <InlineNotice tone="indigo">
          The backend is running in <b>offline demo mode</b> — the analysis below is a tagged sample dataset, not a result
          generated from this document. Configure a Gemini API key in the backend to analyze real documents.
        </InlineNotice>
      )}

      {['obligations', 'timeline', 'flags', 'summary', 'alerts']
        .filter((k) => analysisErrors?.[k])
        .map((k) => (
          <AnalysisErrorBanner key={k} category={k} />
        ))}

      {/* Hero */}
      <div className="bg-white dark:bg-[#121215] rounded-2xl border border-zinc-200/90 dark:border-[#27272A] p-5 sm:p-6 shadow-sm">
        <div className="grid lg:grid-cols-[1fr_auto] gap-5 items-start">
          <div className="min-w-0 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {activeContract?.document_type || extractedData.document_type ? (
                <Badge tone="indigo">{activeContract?.document_type || extractedData.document_type}</Badge>
              ) : null}
              {expiringSoon && (
                <span
                  className={`text-[11px] font-semibold ${
                    expiringSoon.tone === 'rose'
                      ? 'text-rose-600 dark:text-rose-400'
                      : expiringSoon.tone === 'amber'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {formatDateShort(extractedData.expiration_date)} ({expiringSoon.text})
                </span>
              )}
              {!expiringSoon && extractedData.expiration_date ? (
                <Badge tone="zinc">Expires {formatDateShort(extractedData.expiration_date)}</Badge>
              ) : null}
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                {extractedData.title || activeContract?.title || 'Contract Document'}
              </h2>
              {summary?.headline ? (
                <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{summary.headline}</p>
              ) : null}
            </div>

            {partyNames.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {partyNames.map((name, i) => {
                  const initials = name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  const party = extractedData.parties.find((p) => p.name === name);
                  return (
                    <div key={i} className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-[#27272A] px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900/50">
                      <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-white text-[10px] font-black flex items-center justify-center">
                        {initials}
                      </span>
                      <div className="leading-tight">
                        <span className="block text-xs font-bold text-zinc-900 dark:text-white">{name}</span>
                        {party?.role ? (
                          <span className="block text-[10px] text-zinc-400 dark:text-zinc-500">{party.role}</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 lg:flex-col lg:items-end">
            <HealthRing score={score} none={noneFlagged} />
            <div className="text-right">
              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 block">
                {noneFlagged ? 'Reviewer confidence' : 'Calculated from flagged risks'}
              </span>
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                {flags?.length || 0} risk flag{flags?.length === 1 ? '' : 's'} across the agreement
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-zinc-100 dark:border-zinc-800/70 pt-5">
          <FieldRow label="Governing law" value={extractedData.governing_law} />
          <FieldRow label="Financial value" value={extractedData.financial_value} />
          <FieldRow
            label="Effective date"
            value={extractedData.effective_date ? formatDateShort(extractedData.effective_date) : extractedData.effective_date || null}
          />
          <FieldRow
            label="Expiration date"
            value={extractedData.expiration_date ? formatDateShort(extractedData.expiration_date) : extractedData.expiration_date || null}
          />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-5">
        <SectionCard title="Executive Summary" subtitle="Document-grounded" icon={ShieldCheck}>
          {summary?.overview ? (
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{summary.overview}</p>
          ) : (
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 italic">
              Executive summary is still being generated for this contract.
            </p>
          )}
          {summary?.parties_summary ? (
            <div className="mt-4">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block font-medium mb-1.5">Parties</span>
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{summary.parties_summary}</p>
            </div>
          ) : null}
          {summary?.financial_terms ? (
            <div className="mt-4">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block font-medium mb-1.5">Financial terms</span>
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{summary.financial_terms}</p>
            </div>
          ) : null}
          {(summary?.key_commitments || []).length > 0 && (
            <div className="mt-4">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block font-medium mb-1.5">Key commitments</span>
              <ul className="space-y-1.5">
                {summary.key_commitments.slice(0, 6).map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-brand-indigo flex-shrink-0" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(summary?.recommended_actions || []).length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-semibold mb-1.5">
                Recommended actions
              </span>
              <ul className="space-y-1">
                {summary.recommended_actions.slice(0, 5).map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                    <span className="mt-1 w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title="Key Dates & Deadlines" subtitle="From the document timeline" icon={CalendarClock}>
            {importantDates.length === 0 && upcomingTimeline.length === 0 ? (
              <NotProvided />
            ) : (
              <ul className="space-y-2.5">
                {[...importantDates, ...upcomingTimeline.map((t) => ({ date: t.date, label: t.label || t.description }))]
                  .sort((a, b) => (a.date < b.date ? -1 : 1))
                  .slice(0, 6)
                  .map((d, i) => {
                    const rel = deadlineLabel(d.date);
                    return (
                      <li key={i} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block font-semibold text-xs text-zinc-800 dark:text-zinc-200 truncate">
                            {d.label}
                          </span>
                          <span className="block text-[11px] text-zinc-400 dark:text-zinc-500">{formatDateShort(d.date)}</span>
                        </div>
                        {rel && (
                          <span
                            className={`flex-shrink-0 text-[11px] font-semibold ${
                              rel.tone === 'rose'
                                ? 'text-rose-600 dark:text-rose-400'
                                : rel.tone === 'amber'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-zinc-400 dark:text-zinc-500'
                            }`}
                          >
                            {rel.text}
                          </span>
                        )}
                      </li>
                    );
                  })}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Terms to Negotiate"
            subtitle="Highest-priority review points"
            icon={Scale}
            actions={
              flags && flags.length > 3 ? (
                <button onClick={() => setActiveTab('flags')} className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-indigo hover:text-indigo-500">
                  All {flags.length} <ArrowRight className="w-3 h-3" />
                </button>
              ) : null
            }
          >
            {topFlags.length === 0 ? (
              <NotProvided text="No risky terms identified" />
            ) : (
              <div className="space-y-2.5">
                {topFlags.map((f, i) => (
                  <div key={i} className="rounded-xl border border-zinc-200 dark:border-[#27272A] p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">{f.title || 'Flagged term'}</span>
                      <SeverityBadge severity={f.severity} />
                    </div>
                    {f.business_impact && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{f.business_impact}</p>
                    )}
                    {f.page_reference && (
                      <span className="mt-1.5 inline-block text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                        p. {f.page_reference}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Obligations preview */}
      {nextObligations.length > 0 && (
        <SectionCard
          title="Upcoming Obligations"
          subtitle="Deadlines extracted from the agreement"
          icon={ListChecks}
          actions={
            <button onClick={() => setActiveTab('obligations')} className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-indigo hover:text-indigo-500">
              All obligations <ArrowRight className="w-3 h-3" />
            </button>
          }
        >
          <div className="grid sm:grid-cols-2 gap-2.5">
            {nextObligations.map((o, i) => {
              const rel = deadlineLabel(o.deadline);
              return (
                <div key={i} className="rounded-xl border border-zinc-200 dark:border-[#27272A] px-3.5 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">{o.description || o.obligation || o.party}</span>
                    {rel && (
                      <span
                        className={`flex-shrink-0 text-[11px] font-semibold ${
                          rel.tone === 'rose' ? 'text-rose-600 dark:text-rose-400' : rel.tone === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-500'
                        }`}
                      >
                        {rel.text}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                    <span>{o.party || 'Party'}</span>
                    {o.obligation_type ? <Badge tone="zinc">{o.obligation_type}</Badge> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Risk summary strip */}
      {noneFlagged ? (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/20 px-4 py-3">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            No risky clauses were identified in the analyzed text. Review the document text if this contract contains
            sensitive commercial terms that were not detected.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <b>{flags.length} risk item{flags.length === 1 ? '' : 's'}</b> flagged for review. Open the Risk Review tab for
            clause-level detail and negotiation guidance.
          </p>
        </div>
      )}
    </div>
  );
}