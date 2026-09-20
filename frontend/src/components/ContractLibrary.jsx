import React, { useMemo, useState } from 'react';
import { useContractStore } from '../store/useContractStore';
import {
  FilePlus2,
  FileText,
  Search,
  ArrowUpRight,
  RefreshCw,
  Trash2,
  FolderOpen,
  CalendarClock,
  Scale,
  Upload,
} from 'lucide-react';
import { ContractStatusBadge, AnalysisStatusBadge, Badge, DemoBadge } from './ui/badges';
import { EmptyState, LoadingBlock } from './ui/states';

const DAY = 24 * 60 * 60 * 1000;

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseDateIso(s) {
  if (!s) return null;
  const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}

function relativeLabel(dateStr) {
  const d = parseDateIso(dateStr);
  if (!d) return null;
  const diffDays = Math.round((d - new Date()) / DAY);
  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, tone: 'rose' };
  if (diffDays === 0) return { text: 'Due today', tone: 'rose' };
  return { text: `${diffDays}d left`, tone: diffDays <= 7 ? 'amber' : 'zinc' };
}

function nextDeadlineOf(contract) {
  const dates = [
    ...(contract.timeline || []).map((t) => t.date),
    ...(contract.obligations || []).map((o) => o.deadline),
  ].filter((d) => parseDateIso(d));
  if (!dates.length) return null;
  return dates.reduce((a, b) => (a < b ? a : b));
}

export default function ContractLibrary() {
  const {
    contracts,
    activeContractId,
    setActiveTab,
    setActiveContract,
    loadContractById,
    deleteContract,
    reanalyzeContract,
    contractLoading,
    isAnalyzing,
    aiDemoMode,
  } = useContractStore();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [analysisFilter, setAnalysisFilter] = useState('all');
  const [sortBy, setSortBy] = useState('uploaded');

  const rows = useMemo(() => {
    let list = [...contracts];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((c) =>
        [c.title, c.filename, c.document_type, c.name]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') list = list.filter((c) => (c.status || 'active') === statusFilter);
    if (analysisFilter !== 'all') list = list.filter((c) => (c.analysis_status || 'pending') === analysisFilter);

    list.sort((a, b) => {
      if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'deadline') {
        const da = nextDeadlineOf(a) || '9999-99-99';
        const db = nextDeadlineOf(b) || '9999-99-99';
        return da < db ? -1 : da > db ? 1 : 0;
      }
      if (sortBy === 'risk') return (b.health_score || 0) - (a.health_score || 0);
      const ta = a.uploaded_at || a.analyzedAt || '';
      const tb = b.uploaded_at || b.analyzedAt || '';
      return ta < tb ? 1 : ta > tb ? -1 : 0;
    });
    return list;
  }, [contracts, query, statusFilter, analysisFilter, sortBy]);

  const openContract = (c) => {
    if (c.extractedData) setActiveContract(c);
    else loadContractById(c.id);
    setActiveTab('overview');
  };

  const handleDelete = (c) => {
    if (window.confirm(`Delete "${c.title || c.filename}" and all of its saved analysis?`)) {
      deleteContract(c.id);
    }
  };

  const handleReanalyze = (c) => {
    if (window.confirm(`Re-run the AI analysis for "${c.title || c.filename}"?`)) {
      reanalyzeContract(c.id);
    }
  };

  const selectClass =
    'px-3 py-2 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-brand-indigo';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/20">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white">Contract Library</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {contracts.length} contract{contracts.length === 1 ? '' : 's'} in your workspace
            </p>
          </div>
          {aiDemoMode && <DemoBadge />}
        </div>
        <button
          onClick={() => setActiveTab('upload')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs shadow-sm transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload contract
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, document type…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-brand-indigo"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring</option>
          <option value="expired">Expired</option>
        </select>
        <select value={analysisFilter} onChange={(e) => setAnalysisFilter(e.target.value)} className={selectClass}>
          <option value="all">All states</option>
          <option value="completed">Analyzed</option>
          <option value="pending">Not analyzed</option>
          <option value="running">Analyzing</option>
          <option value="failed">Analysis failed</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectClass}>
          <option value="uploaded">Newest first</option>
          <option value="name">Name (A-Z)</option>
          <option value="deadline">Next deadline</option>
          <option value="risk">Health score</option>
        </select>
      </div>

      {contractLoading && contracts.length === 0 ? (
        <LoadingBlock label="Loading your saved contracts…" />
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={FilePlus2}
          title="No contracts yet"
          message="Upload a PDF, DOCX or TXT agreement to generate a document-grounded analysis with obligations, risk review and upcoming deadlines."
          action={
            <button
              onClick={() => setActiveTab('upload')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-indigo hover:bg-indigo-600 text-white text-xs font-semibold shadow"
            >
              <Upload className="w-4 h-4" />
              Upload your first contract
            </button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No contracts match this filter"
          message="Try a different search term or clear the status/state filters."
        />
      ) : (
        <div className="space-y-2.5">
          {rows.map((c) => {
            const isActive = c.id === activeContractId;
            const deadline = nextDeadlineOf(c);
            const rel = deadline ? relativeLabel(deadline) : null;
            const riskHighlights = c.flags?.length ?? c.summary?.risk_highlights?.length ?? 0;
            const fileType = (c.extension || c.file_type || '').toUpperCase();
            return (
              <div
                key={c.id}
                className={`group bg-white dark:bg-[#121215] rounded-2xl border p-4 transition-colors ${
                  isActive
                    ? 'border-brand-indigo/50 ring-1 ring-brand-indigo/20'
                    : 'border-zinc-200/90 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <button onClick={() => openContract(c)} className="flex items-start gap-3 min-w-0 flex-1 text-left">
                    <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-zinc-900 dark:text-white truncate max-w-[320px]">
                          {c.title || c.name || c.filename}
                        </span>
                        {c.document_type && <Badge tone="indigo">{c.document_type}</Badge>}
                        {fileType && <Badge tone="zinc">{fileType}</Badge>}
                      </div>
                      {c.summary?.headline && (
                        <p className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate max-w-[520px] mt-0.5">
                          {c.summary.headline}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap text-[11px] text-zinc-400 dark:text-zinc-500">
                        <span className="font-mono">
                          Uploaded {c.uploaded_at ? new Date(c.uploaded_at).toLocaleDateString() : '—'}
                        </span>
                        <span>
                          {c.pages ? `${c.pages} page${c.pages === 1 ? '' : 's'}` : '—'}
                          {c.word_count ? ` · ${c.word_count.toLocaleString()} words` : ''}
                          {formatBytes(c.file_size_bytes) ? ` · ${formatBytes(c.file_size_bytes)}` : ''}
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="flex lg:flex-col items-center lg:items-end gap-4 lg:gap-1.5 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <ContractStatusBadge status={c.status} />
                      <AnalysisStatusBadge status={c.analysis_status} />
                      {c.analysis_status === 'running' && (
                        <span className="text-[10px] font-mono text-indigo-500 animate-pulse">streaming…</span>
                      )}
                    </div>
                    {riskHighlights > 0 && (
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <Scale className="w-3.5 h-3.5" />
                        <span>
                          {riskHighlights} risk item{riskHighlights === 1 ? '' : 's'}
                          {c.health_score ? ` · Score ${c.health_score}` : ''}
                        </span>
                      </div>
                    )}
                    {deadline && rel && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <CalendarClock className="w-3.5 h-3.5 text-zinc-400" />
                        <span
                          className={`font-semibold ${
                            rel.tone === 'rose'
                              ? 'text-rose-600 dark:text-rose-400'
                              : rel.tone === 'amber'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-zinc-500 dark:text-zinc-400'
                          }`}
                        >
                          Next: {new Date(deadline).toLocaleDateString()} ({rel.text})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 lg:flex-col flex-shrink-0 lg:items-stretch">
                    <button
                      onClick={() => openContract(c)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-700 dark:hover:bg-white text-[11px] font-bold transition-colors"
                      title="Open the analysis report"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Open
                    </button>
                    <div className="flex items-center gap-1.5 justify-center">
                      <button
                        onClick={() => handleReanalyze(c)}
                        disabled={isAnalyzing || c.analysis_status === 'running'}
                        className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
                        title="Re-run AI analysis"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-2 rounded-lg text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete contract"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}