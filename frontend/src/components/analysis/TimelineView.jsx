import React, { useMemo } from 'react';
import { CalendarClock, Flag, CircleDollarSign, RefreshCw, FileX2, CheckSquare, Clock } from 'lucide-react';
import { useContractStore } from '../../store/useContractStore';
import { EmptyState, SectionCard } from '../ui/states';
import { Badge, DemoBadge } from '../ui/badges';
import { deadlineLabel, formatDateShort, parseIsoDate } from './utils';
import AnalysisErrorBanner from './AnalysisErrorBanner';

const TYPE_ICONS = {
  deadline: CalendarClock,
  expiration: FileX2,
  renewal: RefreshCw,
  payment: CircleDollarSign,
  termination: FileX2,
  milestone: Flag,
  obligation: CheckSquare,
};

function typeBadgeTone(type) {
  const t = String(type || 'deadline').toLowerCase();
  if (t === 'expiration' || t === 'termination') return 'rose';
  if (t === 'renewal') return 'indigo';
  if (t === 'payment') return 'emerald';
  return 'zinc';
}

export default function TimelineView() {
  const { timeline, analysisErrors, aiDemoMode } = useContractStore();

  const events = useMemo(() => {
    if (!timeline || timeline.length === 0) return [];
    return [...timeline]
      .filter((t) => parseIsoDate(t.date))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }, [timeline]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const e of events) {
      const d = parseIsoDate(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    return [...map.entries()];
  }, [events]);

  if (analysisErrors?.timeline) {
    return (
      <div className="space-y-5">
        <AnalysisErrorBanner category="timeline" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No dated events identified"
        message="The timeline is built from explicit dates in the agreement (effective date, renewals, payments, deadlines). Scanning quality affects how many dates can be detected."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white">Timeline</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {events.length} dated {events.length === 1 ? 'event' : 'events'} across the agreement
          </p>
        </div>
        {aiDemoMode && <DemoBadge />}
      </div>

      <div className="space-y-4">
        {groups.map(([key, group]) => {
          const [year, month] = key.split('-');
          return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                  {new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </span>
                <span className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
              </div>
              <SectionCard className="!p-2.5">
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {group.map((e, i) => {
                    const Ico = TYPE_ICONS[String(e.type || 'deadline').toLowerCase()] || CalendarClock;
                    const rel = deadlineLabel(e.date);
                    return (
                      <li key={i} className="p-3 flex items-start gap-3">
                        <div className={`p-2 rounded-xl flex-shrink-0 ${rel && rel.tone === 'rose' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                          <Ico className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-sm font-bold text-zinc-900 dark:text-white">{e.label || e.description || 'Event'}</span>
                            <span className="flex items-center gap-2">
                              {e.type && <Badge tone={typeBadgeTone(e.type)}>{e.type}</Badge>}
                              {rel && (
                                <span className={`text-[11px] font-bold ${rel.tone === 'rose' ? 'text-rose-600 dark:text-rose-400' : rel.tone === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                  {rel.text}
                                </span>
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">{e.description}</p>
                          <div className="flex items-center gap-2 flex-wrap mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                            <span className="font-mono font-semibold text-zinc-500 dark:text-zinc-300">{formatDateShort(e.date)}</span>
                            {e.party ? <span>{e.party}</span> : null}
                            {e.page_reference ? <span className="font-mono">p. {e.page_reference}</span> : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </SectionCard>
            </div>
          );
        })}
      </div>
    </div>
  );
}