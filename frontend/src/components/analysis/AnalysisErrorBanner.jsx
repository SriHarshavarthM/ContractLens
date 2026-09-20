import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useContractStore } from '../../store/useContractStore';

const CATEGORY_LABELS = {
  extract: 'Document extraction',
  obligations: 'Obligations & SLAs',
  timeline: 'Timeline',
  flags: 'Risk review',
  summary: 'Executive summary',
  alerts: 'Deadline alerts',
};

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

// Honest per-category failure notice with a retry action. When a category
// failed it is never rendered as an empty result; this banner is the "empty".
export default function AnalysisErrorBanner({ category }) {
  const analysisErrors = useContractStore((s) => s.analysisErrors);
  const retryingCategory = useContractStore((s) => s.retryingCategory);
  const retryAnalysisCategory = useContractStore((s) => s.retryAnalysisCategory);

  const message = analysisErrors?.[category];
  if (!message) return null;
  const retrying = retryingCategory === category;

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/20 px-3.5 py-3">
      <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
          {categoryLabel(category)} could not be generated.
        </p>
        <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5 break-words">{message}</p>
      </div>
      <button
        onClick={() => retryAnalysisCategory(category)}
        disabled={retryingCategory !== null}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-semibold hover:bg-rose-200/70 dark:hover:bg-rose-900/50 disabled:opacity-50 transition-colors flex-shrink-0"
      >
        <RotateCcw className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} />
        {retrying ? 'Retrying…' : 'Retry'}
      </button>
    </div>
  );
}