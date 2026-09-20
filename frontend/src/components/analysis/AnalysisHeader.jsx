import React from 'react';
import { ArrowLeft, FileText, RefreshCw, Settings2 } from 'lucide-react';
import { useContractStore } from '../../store/useContractStore';
import { ContractStatusBadge, AnalysisStatusBadge, Badge, DemoBadge } from '../ui/badges';

export default function AnalysisHeader() {
  const {
    contracts,
    activeContractId,
    setActiveTab,
    reanalyzeContract,
    isAnalyzing,
    aiDemoMode,
  } = useContractStore();

  const activeContract = contracts.find((c) => c.id === activeContractId);
  if (!activeContract) return null;

  const meta = activeContract.analyzed_at || activeContract.uploaded_at;
  const pageCount = activeContract.pages;
  const wordCount = activeContract.word_count;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-200/80 dark:border-[#242427]">
      <div className="flex items-start gap-3 min-w-0">
        <button
          onClick={() => setActiveTab('library')}
          className="p-2 rounded-xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors flex-shrink-0"
          title="Back to the contract library"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white truncate">
              {activeContract.title || activeContract.name || 'Contract Document'}
            </h1>
            {activeContract.document_type ? (
              <Badge tone="indigo">{activeContract.document_type}</Badge>
            ) : activeContract.analysis_status === 'pending' ? (
              <Badge tone="zinc">Document type pending analysis</Badge>
            ) : null}
            {aiDemoMode && <DemoBadge />}
          </div>
          <div className="flex items-center gap-2.5 flex-wrap mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1 font-mono">
              <FileText className="w-3.5 h-3.5" />
              {activeContract.filename || 'document'}
            </span>
            {meta ? (
              <span className="font-mono">
                {activeContract.analysis_status === 'completed' ? 'Analyzed' : 'Uploaded'}{' '}
                {new Date(meta).toLocaleDateString()}
              </span>
            ) : null}
            {pageCount ? (
              <span>
                {pageCount} page{pageCount === 1 ? '' : 's'}
              </span>
            ) : null}
            {wordCount ? <span>{wordCount.toLocaleString()} words</span> : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <ContractStatusBadge status={activeContract.status} />
        <AnalysisStatusBadge status={activeContract.analysis_status} />
        {activeContract.analysis_status === 'running' && (
          <span className="text-[10px] font-mono text-indigo-500 animate-pulse">streaming analysis…</span>
        )}
        <button
          onClick={() => reanalyzeContract(activeContract.id)}
          disabled={isAnalyzing || activeContract.analysis_status === 'running'}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors disabled:opacity-40"
          title="Re-run the full AI analysis for this contract"
        >
          {isAnalyzing && activeContract.analysis_status !== 'running' ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Settings2 className="w-3.5 h-3.5" />
          )}
          {isAnalyzing && activeContract.analysis_status !== 'running' ? 'Analyzing…' : 'Re-analyze'}
        </button>
      </div>
    </div>
  );
}