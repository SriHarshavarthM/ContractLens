import React from 'react';

// ---------------------------------------------------------------------------
// Honest state primitives: loading skeletons, empty states, error surfaces and
// "not found in document" display. Nothing ever shows fabricated values.
// ---------------------------------------------------------------------------

export function SectionCard({ title, subtitle, icon: Icon, children, className = '', actions = null }) {
  return (
    <section className={`bg-white dark:bg-[#121215] rounded-2xl border border-zinc-200/90 dark:border-[#27272A] p-5 sm:p-6 shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex-shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight truncate">{title}</h3>
              {subtitle && <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">{subtitle}</p>}
            </div>
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function NotProvided({ text = 'Not found in document' }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] italic text-zinc-400 dark:text-zinc-500" title="This value was not identified in the analyzed document text.">
      <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
      {text}
    </span>
  );
}

export function EmptyState({ icon: Icon = null, title, message, action = null, compact = false }) {
  return (
    <div className={`bg-white dark:bg-[#121215] rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-14'} px-6`}>
      {Icon && <div className="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center mb-3"><Icon className="w-5 h-5" /></div>}
      <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">{title}</h4>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingBlock({ label = 'Loading…' }) {
  return (
    <div className="space-y-3">
      <div className="h-5 w-44 bg-zinc-200/70 dark:bg-zinc-800 animate-shimmer rounded-lg" />
      <div className="h-24 bg-zinc-100 dark:bg-zinc-800/70 animate-shimmer rounded-xl" />
      <div className="h-24 bg-zinc-100 dark:bg-zinc-800/70 animate-shimmer rounded-xl" />
      <p className="text-center text-[11px] font-mono text-zinc-400 dark:text-zinc-500 pt-1">{label}</p>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message = '', action = null, compact = false }) {
  return (
    <div className={`bg-rose-50/60 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/60 flex flex-col items-start justify-center text-left ${compact ? 'py-6' : 'py-8'} px-6`}>
      <h4 className="text-sm font-bold text-rose-700 dark:text-rose-300 mb-1">{title}</h4>
      <p className="text-xs text-rose-600/90 dark:text-rose-300/80 max-w-lg leading-relaxed break-words">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function InlineNotice({ tone = 'zinc', children }) {
  const tones = {
    zinc: 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400',
    amber: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/60 text-indigo-800 dark:text-indigo-300',
  };
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs leading-relaxed ${tones[tone] || tones.zinc}`}>
      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
      <div>{children}</div>
    </div>
  );
}

// Simple label/value row used across analysis sections.
export function FieldRow({ label, value, mono = false, empty = null }) {
  const hasValue = value !== undefined && value !== null && String(value).trim() !== '';
  return (
    <div>
      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block font-medium mb-0.5">{label}</span>
      {hasValue ? (
        <span className={`font-semibold text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm ${mono ? 'font-mono' : ''}`}>{value}</span>
      ) : (
        <NotProvided text={empty || 'Not found in document'} />
      )}
    </div>
  );
}