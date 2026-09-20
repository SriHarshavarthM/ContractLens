import React, { useMemo, useState } from 'react';
import { Search, Quote, Scale } from 'lucide-react';
import { useContractStore } from '../../store/useContractStore';
import { SectionCard, EmptyState, NotProvided } from '../ui/states';
import { SeverityBadge, Badge, DemoBadge } from '../ui/badges';
import AnalysisErrorBanner from './AnalysisErrorBanner';

export default function ClauseExplorer() {
  const { obligations, flags, extractedData, analysisErrors, aiDemoMode } = useContractStore();
  const [query, setQuery] = useState('');

  const clauseRows = useMemo(() => {
    const rows = [];
    for (const o of obligations || []) {
      const excerpt = o.source_clause || '';
      if (!excerpt && !o.description) continue;
      rows.push({
        key: 'ob|' + o.party + o.description + o.deadline,
        type: 'Obligation clause',
        title: o.description || o.obligation || 'Obligation',
        excerpt,
        party: o.party,
        urgency: o.urgency,
        ref: o.source_clause ? null : null,
        page: null,
      });
    }
    for (const f of flags || []) {
      const excerpt = f.clause_text || '';
      if (!excerpt && !f.title) continue;
      rows.push({
        key: 'flag|' + f.title + f.section_reference,
        type: 'Risk clause',
        title: f.title || 'Flagged term',
        excerpt,
        party: null,
        severity: f.severity,
        ref: f.section_reference,
        page: f.page_reference,
      });
    }
    return rows;
  }, [obligations, flags]);

  const filtered = useMemo(() => {
    if (!query.trim()) return clauseRows;
    const q = query.trim().toLowerCase();
    return clauseRows.filter((r) =>
      [r.title, r.excerpt, r.party, r.type, r.ref].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [clauseRows, query]);

  const serviceObligations = extractedData?.service_obligations;

  if ((analysisErrors?.obligations || analysisErrors?.flags) && clauseRows.length === 0) {
    return (
      <div className="space-y-5">
        {analysisErrors?.obligations && <AnalysisErrorBanner category="obligations" />}
        {analysisErrors?.flags && <AnalysisErrorBanner category="flags" />}
      </div>
    );
  }

  if (clauseRows.length === 0 && !serviceObligations) {
    return (
      <EmptyState
        icon={Scale}
        title="No extracted clauses"
        message="Clauses from obligations and risk flags will appear here once the document has been analyzed."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white">Clause Explorer</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {clauseRows.length} excerpt{clauseRows.length === 1 ? '' : 's'} · each excerpt is taken verbatim from the source document
          </p>
        </div>
        {aiDemoMode && <DemoBadge />}
      </div>

      {analysisErrors?.obligations && <AnalysisErrorBanner category="obligations" />}
      {analysisErrors?.flags && <AnalysisErrorBanner category="flags" />}

      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clause text, parties, sections…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-brand-indigo"
        />
      </div>

      {serviceObligations && (
        <SectionCard title="Scope of services" subtitle="As stated in the agreement" icon={Quote}>
          <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">{serviceObligations}</p>
        </SectionCard>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No clauses match this search" message="Try a different term." />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r) => (
            <div key={r.key} className="bg-white dark:bg-[#121215] rounded-2xl border border-zinc-200/90 dark:border-[#27272A] p-4">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <Badge tone={r.type === 'Risk clause' ? 'rose' : 'indigo'}>{r.type}</Badge>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white truncate">{r.title}</span>
                </div>
                {r.severity ? <SeverityBadge severity={r.severity} /> : r.party ? <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{r.party}</span> : null}
              </div>
              {r.excerpt ? (
                <p className="text-xs italic leading-relaxed text-zinc-500 dark:text-zinc-400">"{r.excerpt}"</p>
              ) : (
                <NotProvided text="No verbatim excerpt available" />
              )}
              {(r.ref || r.page) && (
                <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                  {r.ref ? <Badge tone="zinc">§ {r.ref}</Badge> : null}
                  {r.page ? <Badge tone="zinc">p. {r.page}</Badge> : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}