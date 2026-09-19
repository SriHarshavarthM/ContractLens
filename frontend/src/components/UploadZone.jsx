import React, { useState, useRef } from 'react';
import { useContractStore } from '../store/useContractStore';
import { createSampleContractV1, createSampleContractV2 } from '../data/sample_contract';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  FileCheck
} from 'lucide-react';

export default function UploadZone() {
  const { analyzeContract, isAnalyzing, setContractA, setContractB, setActiveTab } = useContractStore();
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file) => {
    setErrorMsg('');
    setUploadingFileName(file.name);
    setUploadProgress(15);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setUploadProgress(45);
      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed (${res.status})`);
      }

      setUploadProgress(85);
      const data = await res.json();

      setUploadProgress(100);

      // Trigger full AI pipeline
      const contractObj = {
        id: 'c_' + Date.now(),
        filename: file.name,
        title: file.name.replace(/\.[^/.]+$/, ''),
        text: data.text,
        pages: data.pages || 1,
        wordCount: data.word_count || 0,
        uploadedAt: new Date().toISOString(),
      };

      await analyzeContract(contractObj, true);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process document. Please try a valid PDF or text file.');
      setUploadProgress(0);
    }
  };

  const loadSampleContract = async (version = 1) => {
    setErrorMsg('');
    setUploadingFileName(version === 1 ? 'Acme_SaaS_MSA_v1.0.pdf' : 'Acme_SaaS_MSA_v2.0_Revised.pdf');
    setUploadProgress(40);

    const contractText = version === 1 ? createSampleContractV1() : createSampleContractV2();
    const title = version === 1 ? 'Enterprise SaaS Agreement (v1.0)' : 'Enterprise SaaS Agreement (v2.0 Revised)';
    const filename = version === 1 ? 'Acme_Cloud_MSA_v1.0.pdf' : 'Acme_Cloud_MSA_v2.0_Revised.pdf';

    setUploadProgress(80);

    const contractObj = {
      id: 'sample_v' + version + '_' + Date.now(),
      filename,
      title,
      text: contractText,
      pages: 4,
      wordCount: contractText.split(/\s+/).length,
      uploadedAt: new Date().toISOString(),
    };

    setUploadProgress(100);
    await analyzeContract(contractObj, true);
  };

  const loadBothForComparison = async () => {
    setErrorMsg('');
    const v1Text = createSampleContractV1();
    const v2Text = createSampleContractV2();

    const c1 = {
      id: 'sample_v1_' + Date.now(),
      filename: 'Acme_Cloud_MSA_v1.0.pdf',
      title: 'Enterprise SaaS Agreement (v1.0)',
      text: v1Text,
      pages: 4,
      wordCount: v1Text.split(/\s+/).length,
      uploadedAt: new Date().toISOString(),
    };

    const c2 = {
      id: 'sample_v2_' + (Date.now() + 1),
      filename: 'Acme_Cloud_MSA_v2.0_Revised.pdf',
      title: 'Enterprise SaaS Agreement (v2.0 Revised)',
      text: v2Text,
      pages: 4,
      wordCount: v2Text.split(/\s+/).length,
      uploadedAt: new Date().toISOString(),
    };

    setContractA(c1);
    setContractB(c2);
    // Analyze primary contract c1 first
    await analyzeContract(c1, false);
    setActiveTab('compare');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 lg:py-12 flex flex-col items-center">
      {/* Hero Badge & Heading */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-brand-indigo dark:text-indigo-300 text-xs font-semibold mb-6 animate-pulse-subtle">
        <Sparkles className="w-3.5 h-3.5 text-brand-indigo" />
        <span>Enterprise Contract Intelligence &amp; Risk Auditing</span>
      </div>

      <h1 className="text-3xl lg:text-5xl font-extrabold text-center tracking-tight text-zinc-900 dark:text-white mb-4">
        Review Contracts &amp; Track Obligations{' '}
        <span className="bg-gradient-to-r from-brand-indigo via-cyan-500 to-indigo-400 bg-clip-text text-transparent">
          in Seconds
        </span>
      </h1>

      <p className="text-zinc-600 dark:text-zinc-400 text-center max-w-2xl text-sm lg:text-base mb-10 leading-relaxed">
        Upload any enterprise contract or MSA. ContractLens instantly extracts key business terms, maps chronological deadline timelines, isolates party commitments, flags high-risk clauses, and prepares executive summaries.
      </p>

      {/* Main Drag-and-Drop Card with Animated Glow Border */}
      <div className="w-full max-w-2xl relative group">
        {/* Animated gradient ring */}
        <div
          className={`absolute -inset-0.5 bg-gradient-to-r from-brand-indigo via-cyan-500 to-indigo-600 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition duration-700 ${
            dragActive ? 'opacity-90 scale-[1.01]' : ''
          }`}
        />

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative bg-white dark:bg-[#13192B] rounded-3xl p-8 lg:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all border shadow-sm ${
            dragActive
              ? 'border-cyan-400 bg-cyan-50/50 dark:bg-slate-800/90'
              : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400/60 dark:hover:border-indigo-500/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.docx"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Upload Icon with Pulse Glow */}
          <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-brand-indigo/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center mb-6 shadow-md group-hover:scale-105 transition-transform">
            <Upload className="w-9 h-9 text-brand-indigo dark:text-cyan-300 transition-colors" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Drag &amp; drop your contract PDF here
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
            Supports PDF, DOCX, and TXT agreements. Fast multi-page text extraction powered by PyMuPDF and analyzed with Google Gemini.
          </p>

          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-brand-indigo hover:bg-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Select File from Computer</span>
          </button>

          {/* Upload Progress Bar */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full mt-6 max-w-xs">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-mono">
                <span className="truncate max-w-[180px]">{uploadingFileName}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-indigo to-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <p className="mt-4 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800">
              {errorMsg}
            </p>
          )}
        </div>
      </div>

      {/* Quick Sample Contracts Section */}
      <div className="w-full max-w-2xl mt-8 pt-8 border-t border-zinc-200 dark:border-[#27272A] flex flex-col items-center">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Load Verified Contract Datasets</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <button
            onClick={() => loadSampleContract(1)}
            className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] hover:border-brand-indigo dark:hover:border-indigo-500/60 p-4 rounded-xl flex items-center justify-between text-left group shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-brand-indigo">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-brand-indigo transition-colors">
                  Load Master Agreement (v1.0)
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Enterprise SaaS Agreement with SLA &amp; 30-day alerts
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-brand-indigo group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={loadBothForComparison}
            className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] hover:border-cyan-500 dark:hover:border-cyan-500/60 p-4 rounded-xl flex items-center justify-between text-left group shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                  Load v1 vs v2 (Compare Diff)
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Side-by-side diff with marked changes &amp; risk analysis
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
}
