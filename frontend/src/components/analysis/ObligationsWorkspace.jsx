import React, { useMemo, useState } from 'react';
import { ListChecks, Search, CalendarClock } from 'lucide-react';
import { useContractStore } from '../../store/useContractStore';
import { SectionCard, EmptyState } from '../ui/states';
import { UrgencyBadge, DemoBadge, Badge } from '../ui/badges';
import { deadlineLabel, formatDateShort, urgencySortKey, joinNames } from './utils';
import AnalysisErrorBanner from './AnalysisErrorBanner';

export default function ObligationsWorkspace() {
  const { obligations, analysisErrors, aiDemoMode, setActiveTab } = useContractStore();

  const [query, setQuery] = useState('');
  const [partyFilter, setPartyFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  const parties = joinNames(obligations, 'party');

  const rows = useMemo(() => {
    let list = [...(obligations || [])];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((o) =>
        [o.description, o.party, o.obligation_type, o.source_clause, o.frequency]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }
    if (partyFilter !== 'all') list = list.filter((o) => o.party === partyFilter);
    if (urgencyFilter !== 'all') list = list.filter((o) => (o.urgency || 'Medium').toLowerCase() === urgencyFilter);

    list.sort((a, b) => {
      const ua = urgencySortKey(a);
      const ub = urgencySortKey(b);
      if (ua !== ub) return ua - ub;
      if (a.deadline && b.deadline) return a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0;
      return (a.party || '').localeCompare(b.party || '');
    });
    return list;
  }, [obligations, query, partyFilter, urgencyFilter]);

  const upcoming = rows.filter((o) => o.deadline && deadlineLabel(o.deadline));
  const expiringSoon = upcoming.filter((o) => ['rose', 'amber'].includes(deadlineLabel(o.deadline).tone));

  const selectClass =
    'px-3 py-2 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-brand-indigo';

  if (analysisErrors?.obligations) {
    return (
      <div className="space-y-5">
        <AnalysisErrorBanner category="obligations" />
      </div>
    );
  }

  if (!obligations || obligations.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="No obligations extracted"
        message="No individual obligations with deadlines were identified in the analyzed text. Text OCR or scanning quality affects how much detail can be extracted."
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white">Obligations</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {rows.length} of {obligations.length} obligations
            {expiringSoon.length > 0 ? ` · ${expiringSoon.length} due within 7 days` : ''}
            {aiDemoMode ? ' · ' : ''}
          </p>
        </div>
        {aiDemoMode && <DemoBadge />}
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search descriptions, parties, clauses…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-brand-indigo"
          />
        </div>
        <select value={partyFilter} onChange={(e) => setPartyFilter(e.target.value)} className={selectClass}>
          <option value="all">All parties</option>
          {parties.map((p, i) => (
            <option key={i} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)} className={selectClass}>
          <option value="all">All urgency</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Search} title="No obligations match this filter" message="Try a different search or clear the filters." />
      ) : (
        <SectionCard className="!p-2.5">
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {rows.map((o, i) => {
              const rel = o.deadline ? deadlineLabel(o.deadline) : null;
              return (
                <li key={i} className="p-3 sm:px-3.5 flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug">{o.description || o.obligation}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                      {o.party ? <span className="font-semibold text-zinc-500 dark:text-zinc-400">{o.party}</span> : null}
                      {o.obligation_type ? <Badge tone="indigo">{o.obligation_type}</Badge> : null}
                      {o.deadline_type ? <Badge tone="zinc">{o.deadline_type}</Badge> : null}
                      {(o.recurrence || o.frequency) ? <Badge tone="indigo">Repeats: {o.recurrence || o.frequency}</Badge> : null}
                    </div>
                    {(o.consequence || o.penalty) && (
                      <p className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        <strong className="font-semibold">Breach Consequence:</strong> {o.consequence || o.penalty}
                      </p>
                    )}
                    {o.source_clause && (
                      <p className="mt-1.5 text-[11px] italic text-zinc-400 dark:text-zinc-500 truncate">「{o.source_clause}」</p>
                    )}
                  </div>
                  <div className="flex sm:flex-col sm:items-end items-center gap-2 sm:gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400">
                      <CalendarClock className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
                      {o.deadline ? (
                        <span className="font-semibold">{formatDateShort(o.deadline)}</span>
                      ) : (
                        <span className="italic text-[11px] text-zinc-400 dark:text-zinc-500">No deadline set</span>
                      )}
                    </div>
                    {rel && (
                      <span
                        className={`text-[11px] font-bold ${
                          rel.tone === 'rose' ? 'text-rose-600 dark:text-rose-400' : rel.tone === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-500'
                        }`}
                      >
                        {rel.text}
                      </span>
                    )}
                    <UrgencyBadge urgency={o.urgency} />
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}