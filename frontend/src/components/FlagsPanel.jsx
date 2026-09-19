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
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {flags.length} Potential Risk Clauses Identified
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Clause Risk & Ambiguity Audit</h2>
          <p className="text-xs text-slate-400">
            Unilateral obligations, disproportionate liability limits, and non-standard provisions flagged for human review.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
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
              className={`glass-card p-6 rounded-2xl border ${style.border} ${style.bg} transition-all space-y-4`}
            >
              {/* Top Meta Line */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-navy-950 border border-white/10 ${style.iconColor}`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border ${style.badge} mr-2`}>
                      {style.label}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      {flag.section_reference || `Section ${idx + 1}`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuickCopyClause(flag, idx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 border border-white/10 hover:border-white/20 text-slate-300 text-xs font-medium transition-colors"
                    title="Copy exact clause text"
                  >
                    {copiedId === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Clause</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedFlagForEmail(flag)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-indigo hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Copy for Legal Review</span>
                  </button>
                </div>
              </div>

              {/* Exact Clause Excerpt */}
              <div className="p-3.5 rounded-xl bg-navy-950/90 border border-white/10">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                  Contract Excerpt
                </div>
                <p className="text-xs text-slate-200 font-mono italic leading-relaxed">
                  &quot;{flag.clause_text}&quot;
                </p>
              </div>

              {/* AI Risk Analysis Reason */}
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Why This is Flagged</span>
                </div>
                <p className="text-sm text-slate-200 font-medium leading-relaxed">
                  {flag.reason}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* "Copy for Legal Review" Email Drafter Modal */}
      {selectedFlagForEmail && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-2xl w-full border border-indigo-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand-indigo" />
                <h3 className="font-bold text-white text-base">
                  Pre-drafted Legal Review Advisory Email
                </h3>
              </div>
              <button
                onClick={() => setSelectedFlagForEmail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Subject */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Subject Line
              </label>
              <div className="p-2.5 rounded-lg bg-navy-950 border border-white/10 text-xs font-mono text-white font-medium">
                {generateEmailDraft(selectedFlagForEmail).subject}
              </div>
            </div>

            {/* Email Body */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Formatted Email Body
              </label>
              <textarea
                readOnly
                rows={11}
                value={generateEmailDraft(selectedFlagForEmail).body}
                className="w-full p-3 rounded-xl bg-navy-950 border border-white/10 text-xs font-mono text-slate-200 leading-relaxed focus:outline-none resize-none"
              />
            </div>

            {/* Modal Footer Buttons */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Ready to paste directly into Outlook, Gmail, or Slack.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedFlagForEmail(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                >
                  Close
                </button>
                <button
                  onClick={() => handleCopyEmail(generateEmailDraft(selectedFlagForEmail))}
                  className="px-4 py-2 bg-brand-indigo hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all"
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

      <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-500 pr-2">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span>Powered by Gemini 1.5 Pro</span>
      </div>
    </div>
  );
}
