import React, { useState } from 'react';
import { useContractStore } from '../store/useContractStore';
import {
  AlertTriangle,
  Mail,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Info,
  X
} from 'lucide-react';

export default function FlagsPanel() {
  const { flags, activeContractId, contracts } = useContractStore();
  const [selectedFlagForEmail, setSelectedFlagForEmail] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const activeContract = contracts.find((c) => c.id === activeContractId);
  const contractTitle = activeContract?.title || activeContract?.filename || 'Master Services Agreement';

  if (!flags || flags.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center">
        <ShieldAlert className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">No Risk Flags Detected</h3>
        <p className="text-xs text-slate-400">
          Clauses reviewed. No aggressive liability caps or ambiguous provisions found.
        </p>
      </div>
    );
  }

  const getSeverityStyle = (severity) => {
    const s = (severity || 'medium').toLowerCase();
    if (s === 'high' || s === 'critical') {
      return {
        badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        border: 'border-rose-500/30',
        bg: 'bg-rose-500/5',
        iconColor: 'text-rose-400',
        label: 'High Risk'
      };
    }
    if (s === 'medium') {
      return {
        badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/5',
        iconColor: 'text-amber-400',
        label: 'Medium Risk'
      };
    }
    return {
      badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
      border: 'border-yellow-500/30',
      bg: 'bg-yellow-500/5',
      iconColor: 'text-yellow-400',
      label: 'Low / Ambiguous'
    };
  };

  const generateEmailDraft = (flag) => {
    return {
      subject: `[LEGAL REVIEW REQUEST] Risk Flagged in ${contractTitle} (${flag.section_reference || 'Clause Review'})`,
      body: `Hi Legal Team,

During AI pre-execution screening of "${contractTitle}", the following clause was flagged as ${flag.severity.toUpperCase()} RISK:

SECTION / CLAUSE:
${flag.section_reference || 'Identified Clause'}

EXACT CONTRACT EXCERPT:
"${flag.clause_text}"

IDENTIFIED RISK & IMPACT:
${flag.reason}

RECOMMENDED ACTION:
Please advise on proposed counter-language or whether we should request a redline revision prior to signature.

Best regards,
ContractLens Review Team`
    };
  };

  const handleCopyEmail = (emailContent) => {
    const fullText = `Subject: ${emailContent.subject}\n\n${emailContent.body}`;
    navigator.clipboard.writeText(fullText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleQuickCopyClause = (flag, index) => {
    navigator.clipboard.writeText(flag.clause_text);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              {flags.length} Potential Risk Clauses Identified
            </span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Clause Risk & Ambiguity Audit</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Unilateral obligations, disproportionate liability limits, and non-standard provisions flagged for human review.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Info className="w-3.5 h-3.5 text-brand-indigo" />
          <span>Click &quot;Copy for Legal Review&quot; to auto-generate attorney briefs</span>
        </div>
      </div>

      {/* Flagged Clauses Grid */}
      <div className="space-y-4">
        {flags.map((flag, idx) => {
          const style = getSeverityStyle(flag.severity);
          const emailDraft = generateEmailDraft(flag);

          return (
            <div
              key={idx}
              className={`p-6 rounded-2xl border transition-all space-y-4 bg-white dark:bg-[#121215] ${style.border}`}
            >
              {/* Top Meta Line */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] ${style.iconColor}`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border ${style.badge}`}>
                      {style.label}
                    </span>
                    {flag.flag_type && (
                      <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-[#18181B] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {flag.flag_type}
                      </span>
                    )}
                    <span className="text-xs font-mono font-bold text-zinc-900 dark:text-white">
                      {flag.section_reference || `Section ${idx + 1}`}
                    </span>
                    {flag.affected_party && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                        · Impacts: <strong className="text-zinc-800 dark:text-zinc-200">{flag.affected_party}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuickCopyClause(flag, idx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors"
                    title="Copy exact clause text"
                  >
                    {copiedId === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Copy Clause</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedFlagForEmail(flag)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-indigo hover:bg-indigo-600 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Copy for Legal Review</span>
                  </button>
                </div>
              </div>

              {/* Exact Clause Excerpt */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A]">
                <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  Contract Excerpt
                </div>
                <p className="text-xs text-zinc-800 dark:text-zinc-200 font-mono italic leading-relaxed">
                  &quot;{flag.clause_text}&quot;
                </p>
              </div>

              {/* AI Risk Analysis Reason */}
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Why This is Flagged</span>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                  {flag.reason}
                </p>
              </div>

              {/* Suggested Alternative Redline Revision */}
              {flag.suggested_revision && (
                <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Recommended Redline Revision (Alternative Clause)</span>
                  </div>
                  <p className="text-xs text-emerald-900 dark:text-emerald-200 font-mono italic leading-relaxed">
                    &quot;{flag.suggested_revision}&quot;
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* "Copy for Legal Review" Email Drafter Modal */}
      {selectedFlagForEmail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141417] p-6 rounded-2xl max-w-2xl w-full border border-zinc-200 dark:border-[#27272A] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-[#27272A]">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand-indigo" />
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                  Pre-drafted Legal Review Advisory Email
                </h3>
              </div>
              <button
                onClick={() => setSelectedFlagForEmail(null)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Subject */}
            <div>
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                Subject Line
              </label>
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs font-mono text-zinc-900 dark:text-white font-medium">
                {generateEmailDraft(selectedFlagForEmail).subject}
              </div>
            </div>

            {/* Email Body */}
            <div>
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                Formatted Email Body
              </label>
              <textarea
                readOnly
                rows={11}
                value={generateEmailDraft(selectedFlagForEmail).body}
                className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs font-mono text-zinc-800 dark:text-zinc-200 leading-relaxed focus:outline-none resize-none"
              />
            </div>

            {/* Modal Footer Buttons */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Ready to paste directly into Outlook, Gmail, or Slack.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedFlagForEmail(null)}
                  className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleCopyEmail(generateEmailDraft(selectedFlagForEmail))}
                  className="px-4 py-2 bg-brand-indigo hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center gap-2"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Full Email Draft</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 pr-2">
        <Sparkles className="w-3 h-3 text-brand-indigo" />
        <span>Powered by Gemini 1.5 Pro</span>
      </div>
    </div>
  );
}
