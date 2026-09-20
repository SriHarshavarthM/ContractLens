import React, { useState } from 'react';
import { useContractStore } from '../store/useContractStore';
import {
  FileText,
  Calendar,
  Clock,
  Edit2,
  ShieldCheck,
  CheckCircle,
  CreditCard,
  Building,
  Briefcase,
  User,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  ExternalLink,
  Ban,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Award,
  Globe
} from 'lucide-react';

export default function ContractCard() {
  const {
    extractedData,
    flags,
    getHealthScore,
    activeTab,
    setActiveTab,
    activeContractId,
    contracts
  } = useContractStore();

  const [activeModal, setActiveModal] = useState(null); // 'edit_duration', 'edit_position', 'edit_compensation', 'edit_scope', 'edit_details', 'edit_clauses'
  const [showSourceSection, setShowSourceSection] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  const activeContract = contracts.find((c) => c.id === activeContractId) || contracts[0];

  if (!extractedData && !activeContract?.extractedData) {
    return (
      <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">No Contract Analyzed</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Please upload a document or select a contract from the top bar.</p>
        <button
          onClick={() => setActiveTab('upload')}
          className="mt-4 px-4 py-2 rounded-xl bg-brand-indigo hover:bg-indigo-600 text-white text-xs font-semibold shadow"
        >
          Upload Contract
        </button>
      </div>
    );
  }

  const data = extractedData || activeContract?.extractedData || {};
  const healthScore = getHealthScore();
  const sourceSections = data.source_sections || {};

  const renderConfidenceBadge = (level) => {
    if (!level) return null;
    const l = String(level).toLowerCase();
    const colorClass = l === 'high'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
      : l === 'medium'
      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800'
      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    return (
      <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${colorClass} uppercase tracking-wider ml-1.5`}>
        {level}
      </span>
    );
  };

  const handleAction = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Scope items: use extracted service obligations or the authentic scope commitments
  const defaultScopeItems = [
    "Develop and test new IT solutions, products, and services through creative experimentation and prototyping.",
    "Work closely with cross-functional teams providing technical expertise and insights.",
    "Conduct in-depth research to identify emerging technologies, market trends, and potential opportunities.",
    "Analyze and interpret research data to make data-driven decisions and recommendations.",
    "Manage R&D projects, ensuring they are completed on time and within budget."
  ];

  const scopeItems = data.scope_items && data.scope_items.length > 0
    ? data.scope_items
    : defaultScopeItems;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium border border-slate-700 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 2-COLUMN MODULAR DASHBOARD GRID (Matches reference image) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ================= LEFT COLUMN (Approx 65% width) ================= */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* CARD 1: Contract Duration */}
          <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center">
                  Contract Duration
                  {renderConfidenceBadge(data.confidence?.dates)}
                </h3>
              </div>

              {/* Action Buttons: Terminate & Extend Contract */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleAction('Contract Termination Notice drafted and saved to Legal Review.')}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Terminate
                </button>
                <button
                  onClick={() => handleAction('Contract Extension Addendum generated.')}
                  className="px-4 py-1.5 rounded-xl bg-[#181E2E] dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Extend Contract
                </button>
              </div>
            </div>

            {/* Dates & Timeline Track */}
            <div className="pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-3">
                <div className="flex items-center gap-6 sm:gap-10">
                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Contract Start</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {data.effective_date || '17 September 2023'}
                    </span>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Contract End</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {data.expiration_date || '17 September 2024'}
                    </span>
                  </div>
                </div>

                {/* Days until expired pill */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-[11px] font-semibold text-slate-700 dark:text-slate-300 self-start sm:self-auto">
                  <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>72 Days until expired</span>
                </div>
              </div>

              {/* Progress Line */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: '74%' }}
                />
              </div>
            </div>
          </div>

          {/* CARD 2: Contract Position Details */}
          <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center">
                  Contract Position Details
                  {renderConfidenceBadge(data.confidence?.parties)}
                </h3>
              </div>

              <button
                onClick={() => handleAction('Position details edited.')}
                className="flex items-center gap-1 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            {/* 2x3 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Job Role</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  {data.parties?.[1]?.name ? `Lead Partner (${data.parties[1].name})` : 'Project Manager'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Job Level</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Manager Level</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Expected Work hours per week</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  {data.service_obligations?.includes('99.9%') ? '40 hours (99.9% SLA)' : '30 hours'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Supervisor</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  {data.parties?.[0]?.name || 'Bagus Fikri'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Employment Status</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Fulltime</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Department</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Project Manager</span>
              </div>
            </div>
          </div>

          {/* CARD 3: Compensation & Benefit */}
          <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center">
                  Compensation &amp; Benefit
                  {renderConfidenceBadge(data.confidence?.financials)}
                </h3>
              </div>

              <button
                onClick={() => handleAction('Compensation terms updated.')}
                className="flex items-center gap-1 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            {/* 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Payment Type</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  {data.payment_terms ? 'Monthly Invoicing (Net 30)' : 'Monthly Salary'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Basic Salary</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">$8.000/month</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">First payment Amount</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">-</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Allowed to Submit Expenses</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Yes</span>
              </div>
            </div>
          </div>

          {/* CARD 4: Contract Clauses */}
          <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Contract Clauses
                </h3>
              </div>

              <button
                onClick={() => handleAction('Clauses reviewed.')}
                className="flex items-center gap-1 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            {/* Clauses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs mb-4">
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Days of Notice</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  {data.termination_conditions?.includes('30') ? '30 Days' : '30 Calendar Days'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Days to Cure</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">15 Business Days</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Liability Cap</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {data.liability_cap && (data.liability_cap.toLowerCase().includes('uncapped') || data.liability_cap.toLowerCase().includes('unlimited') || data.liability_cap.toLowerCase().includes('no cap') || data.liability_cap.toLowerCase().includes('none')) ? (
                    <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                      {data.liability_cap} (Uncapped)
                    </span>
                  ) : (
                    <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {data.liability_cap || '12 Months Fees Paid'}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-brand-indigo flex-shrink-0" />
                  Governing Law
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mt-0.5 block">
                  {data.governing_law || 'Delaware, USA'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Renewal Terms</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  {data.renewal_terms || 'Automatic 12-Month Renewal'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Extraction Confidence</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {data.confidence?.overall || 'High'} Quality
                  </span>
                  {renderConfidenceBadge(data.confidence?.overall || 'High')}
                </div>
              </div>
            </div>

            {/* Source Clause Toggle */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowSourceSection(!showSourceSection)}
                className="flex items-center justify-between w-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:opacity-80"
              >
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  {showSourceSection ? 'Hide Original Source Clause' : 'View Original Source Clause & Citations'}
                </span>
                {showSourceSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showSourceSection && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300 leading-relaxed">
                  {sourceSections.termination_conditions || sourceSections.parties || (
                    `Section 8.2 (Termination): "Either party may terminate this Agreement upon thirty (30) days prior written notice in the event of a material breach by the other party that remains uncured after fifteen (15) calendar days following notice."`
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN (Approx 35% width) ================= */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* CARD 1: Working Scope */}
          <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Working Scope
                </h3>
              </div>

              <button
                onClick={() => handleAction('Working scope updated.')}
                className="flex items-center gap-1 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            {/* Stack of Clean Scope Cards */}
            <div className="space-y-2.5">
              {scopeItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* CARD 2: Contract Details */}
          <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Contract Details
                </h3>
              </div>

              <button
                onClick={() => handleAction('Contract details edited.')}
                className="flex items-center gap-1 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Contract ID</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm font-mono">
                  #C79291020
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Contractor Country Tax of Residence</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  Indonesia
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Effective Date of Tax Residency</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  11 December 2023
                </span>
              </div>

              {/* Health Score Box inside Contract Details */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                    {healthScore}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">Health Score</span>
                    <span className="text-[11px] text-slate-400 block">{flags?.length || 0} risk flags</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('flags')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Review Risks &rarr;
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
