import React, { useState, useEffect } from 'react';
import { useContractStore } from '../store/useContractStore';
import { createSampleContractV1, createSampleContractV2 } from '../data/sample_contract';
import {
  GitCompare,
  ArrowRight,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  Upload,
  Sparkles,
  FileText,
  Layers,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export default function CompareView() {
  const {
    contractA,
    contractB,
    setContractA,
    setContractB,
    compareDiff,
    runComparison,
    isComparing,
    contracts
  } = useContractStore();

  const [activeTabSlot, setActiveTabSlot] = useState('diff'); // 'diff' | 'raw'

  // If contractA and contractB are present, auto run comparison if not yet computed
  useEffect(() => {
    if (contractA && contractB && !compareDiff && !isComparing) {
      runComparison();
    }
  }, [contractA, contractB]);

  const loadSampleSlots = () => {
    const v1 = {
      id: 'v1_' + Date.now(),
      title: 'Enterprise SaaS Agreement (v1.0 Standard)',
      filename: 'Acme_Cloud_MSA_v1.0.pdf',
      text: createSampleContractV1(),
    };
    const v2 = {
      id: 'v2_' + (Date.now() + 1),
      title: 'Enterprise SaaS Agreement (v2.0 Revised)',
      filename: 'Acme_Cloud_MSA_v2.0_Revised.pdf',
      text: createSampleContractV2(),
    };
    setContractA(v1);
    setContractB(v2);
  };

  const handleFileUpload = async (e, slot) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      const obj = {
        id: 'slot_' + Date.now(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        filename: file.name,
        text: data.text,
      };
      if (slot === 'A') setContractA(obj);
      else setContractB(obj);
    } catch (err) {
      console.error(err);
    }
  };

  const getChangeStyle = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'added') {
      return {
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        card: 'border-emerald-500/30 bg-emerald-500/5',
        icon: PlusCircle,
        iconColor: 'text-emerald-400',
        label: 'ADDED IN VERSION B'
      };
    }
    if (t === 'removed') {
      return {
        badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        card: 'border-rose-500/30 bg-rose-500/5',
        icon: MinusCircle,
        iconColor: 'text-rose-400',
        label: 'REMOVED IN VERSION B'
      };
    }
    return {
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      card: 'border-amber-500/30 bg-amber-500/5',
      icon: AlertCircle,
      iconColor: 'text-amber-400',
      label: 'MODIFIED TERMS'
    };
  };

  return (
    <div className="space-y-6">
      {/* Header & Slot Selectors */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-indigo/20 text-indigo-300 border border-indigo-500/30">
                AI Redline & Version Diff
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">Compare Two Contract Versions</h2>
            <p className="text-xs text-slate-400">
              Detects commercial concessions, altered liability thresholds, modified payment periods, and sneakily inserted clauses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadSampleSlots}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Load Sample v1 vs v2</span>
            </button>

            {contractA && contractB && (
              <button
                onClick={runComparison}
                disabled={isComparing}
                className="px-4 py-1.5 rounded-xl bg-brand-indigo hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isComparing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Diff...</span>
                  </>
                ) : (
                  <>
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>Re-run Comparison</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Dual Contract Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contract A Slot */}
          <div className="glass-card p-4 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Contract A (Baseline)
              </span>
              <label className="cursor-pointer text-[11px] text-slate-400 hover:text-white flex items-center gap-1">
                <Upload className="w-3 h-3" />
                <span>Upload file</span>
                <input
                  type="file"
                  accept=".pdf,.txt,.docx"
                  onChange={(e) => handleFileUpload(e, 'A')}
                  className="hidden"
                />
              </label>
            </div>

            {contractA ? (
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-navy-950 border border-white/10">
                <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-semibold text-white truncate">
                    {contractA.title || contractA.filename}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {contractA.text.split(/\s+/).length} words
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-navy-950/50 border border-dashed border-white/10 text-center text-xs text-slate-400">
                Slot empty. Upload or load sample.
              </div>
            )}
          </div>

          {/* Contract B Slot */}
          <div className="glass-card p-4 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Contract B (Revision / Counter)
              </span>
              <label className="cursor-pointer text-[11px] text-slate-400 hover:text-white flex items-center gap-1">
                <Upload className="w-3 h-3" />
                <span>Upload file</span>
                <input
                  type="file"
                  accept=".pdf,.txt,.docx"
                  onChange={(e) => handleFileUpload(e, 'B')}
                  className="hidden"
                />
              </label>
            </div>

            {contractB ? (
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-navy-950 border border-white/10">
                <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-semibold text-white truncate">
                    {contractB.title || contractB.filename}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {contractB.text.split(/\s+/).length} words
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-navy-950/50 border border-dashed border-white/10 text-center text-xs text-slate-400">
                Slot empty. Upload or load sample.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Results */}
      {isComparing && (
        <div className="glass-panel p-12 rounded-2xl text-center">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white mb-1">Comparing Contract Versions...</h4>
          <p className="text-xs text-slate-400">Identifying modified provisions, added terms, and omitted protections.</p>
        </div>
      )}

      {!isComparing && compareDiff && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Identified Contractual Differences ({compareDiff.changes?.length || 0})
            </h3>
            <span className="text-xs text-slate-400">
              Sorted by business significance
            </span>
          </div>

          <div className="space-y-4">
            {(compareDiff.changes || []).map((change, idx) => {
              const style = getChangeStyle(change.type);
              const Icon = style.icon;

              return (
                <div
                  key={idx}
                  className={`glass-card p-6 rounded-2xl border ${style.card} space-y-4 transition-all`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${style.iconColor}`} />
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${style.badge}`}>
                        {style.label}
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {change.section}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        change.significance === 'High'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : change.significance === 'Medium'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      }`}
                    >
                      {change.significance || 'Medium'} Impact
                    </span>
                  </div>

                  {/* Explanation of difference */}
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    <strong className="text-white">Business Impact: </strong>
                    {change.explanation}
                  </p>

                  {/* Side-by-side text difference */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-navy-950 border border-white/10">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
                        Contract A (Original)
                      </div>
                      <p className="text-xs font-mono text-slate-300 leading-relaxed">
                        {change.contract_a_text}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-navy-950 border border-white/10">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1">
                        Contract B (Counter Revision)
                      </div>
                      <p className="text-xs font-mono text-slate-300 leading-relaxed">
                        {change.contract_b_text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isComparing && !compareDiff && (
        <div className="glass-panel p-12 rounded-2xl text-center">
          <GitCompare className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white mb-1">Ready to Compare Agreements</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Upload two versions of an agreement or click &quot;Load Sample v1 vs v2&quot; to test the comparison engine.
          </p>
          <button
            onClick={loadSampleSlots}
            className="px-4 py-2 rounded-xl bg-brand-indigo hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/30 inline-flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span>Load Sample v1 vs v2 Now</span>
          </button>
        </div>
      )}

      <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-500 pr-2">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span>Powered by Gemini 1.5 Pro</span>
      </div>
    </div>
  );
}
