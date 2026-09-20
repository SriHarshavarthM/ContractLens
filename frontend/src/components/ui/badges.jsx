import React from 'react';

// ---------------------------------------------------------------------------
// Reusable badge components (dark-mode aware, honest labeling).
// ---------------------------------------------------------------------------

const TONE = {
  emerald: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  rose: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  zinc: 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
  indigo: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  cyan: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60',
};

const DOT = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  zinc: 'bg-zinc-400',
  indigo: 'bg-indigo-500',
  cyan: 'bg-cyan-500',
};

export function Badge({ tone = 'zinc', children, className = '', dot = false, pulsing = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${TONE[tone] || TONE.zinc} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOT[tone] || DOT.zinc} ${pulsing ? 'animate-pulse' : ''}`} />}
      {children}
    </span>
  );
}

export function ContractStatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  const map = {
    active: { tone: 'emerald', label: 'Active' },
    expiring: { tone: 'amber', label: 'Expiring' },
    expired: { tone: 'rose', label: 'Expired' },
  };
  const cfg = map[s] || { tone: 'zinc', label: s || 'Unknown' };
  return <Badge tone={cfg.tone} dot>{cfg.label}</Badge>;
}

export function AnalysisStatusBadge({ status }) {
  const s = (status || 'pending').toLowerCase();
  const map = {
    pending: { tone: 'zinc', label: 'Not analyzed', pulse: false },
    running: { tone: 'indigo', label: 'Analyzing…', pulse: true },
    completed: { tone: 'emerald', label: 'Analyzed', pulse: false },
    failed: { tone: 'rose', label: 'Analysis failed', pulse: false },
  };
  const cfg = map[s] || { tone: 'zinc', label: s, pulse: false };
  return <Badge tone={cfg.tone} dot pulsing={cfg.pulse}>{cfg.label}</Badge>;
}

export function SeverityBadge({ severity }) {
  const sev = (severity || '').toLowerCase();
  const map = {
    high: { tone: 'rose', label: 'High' },
    critical: { tone: 'rose', label: 'Critical' },
    medium: { tone: 'amber', label: 'Medium' },
    low: { tone: 'emerald', label: 'Low' },
  };
  const cfg = map[sev] || { tone: 'zinc', label: severity || 'Unrated' };
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

export function UrgencyBadge({ urgency }) {
  const u = (urgency || '').toLowerCase();
  const map = {
    critical: { tone: 'rose', label: 'Critical' },
    high: { tone: 'amber', label: 'High' },
    medium: { tone: 'zinc', label: 'Medium' },
    low: { tone: 'emerald', label: 'Low' },
  };
  const cfg = map[u] || { tone: 'zinc', label: u || '—' };
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

export function DemoBadge({ show = true }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300" title="These results are the offline sample dataset, not an analysis of your document.">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      Offline demo data
    </span>
  );
}

export function CodePill({ children }) {
  return (
    <code className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
      {children}
    </code>
  );
}