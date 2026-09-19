import React, { useState, useRef, useEffect } from 'react';
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
  FileCheck,
  Cpu,
} from 'lucide-react';

const PROCESSING_STEPS = [
  "Connecting to Gemini 2.5 Pro...",
  "Extracting contract text with PyMuPDF...",
  "Gemini 2.5 Pro is reading your contract...",
  "Identifying parties and key terms...",
  "Mapping party obligations and urgency levels...",
  "Building chronological deadline timeline...",
  "Auditing clauses for legal risk...",
  "Generating executive briefing...",
  "Computing deadline alerts...",
  "Finalizing contract intelligence report..."
];

export default function UploadZone() {
  const store = useContractStore();
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  // Streaming & Live Progress state
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamedTokens, setStreamedTokens] = useState('');
  const [displayStep, setDisplayStep] = useState(PROCESSING_STEPS[0]);

  // Step C: Cycle through PROCESSING_STEPS every 2200ms while processing
  useEffect(() => {
    if (!isProcessing) return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % PROCESSING_STEPS.length;
      setDisplayStep(PROCESSING_STEPS[i]);
    }, 2200);
    return () => clearInterval(interval);
  }, [isProcessing]);

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

  // Step B3: Streaming Contract Analysis implementation
  const analyzeWithStream = async (contractText, fileName = 'contract.pdf', contractId = null, extraData = {}) => {
    setIsProcessing(true);
    setStreamedTokens('');
    const initialStep = "Connecting to Gemini 2.5 Pro...";
    setDisplayStep(initialStep);
    store.setProcessing(initialStep);

    const cid = contractId || ('c_' + Date.now());
    const today = new Date().toISOString().split('T')[0];

    try {
      // Use streaming for extract (slowest + most tokens)
      const response = await fetch('/extract/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: contractText,
          filename: fileName,
          contract_id: cid,
          ref_date: today,
        }),
      });

      if (!response.ok) {
        throw new Error(`Streaming failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      store.setProcessing("Gemini is reading your contract...");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        // Parse SSE lines
        const lines = raw.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const event = JSON.parse(line.replace('data: ', ''));

            if (event.type === 'chunk') {
              accumulated += event.text;
              setStreamedTokens(accumulated);
              store.setStreamedTokens(accumulated);
              // Show live token count so user sees progress
              const liveMsg = `Gemini is reading your contract... (${accumulated.length} tokens)`;
              setDisplayStep(liveMsg);
              store.setProcessing(liveMsg);
            }

            if (event.type === 'complete') {
              store.setExtractedData(event.data);
              const compMsg = "Extraction complete. Analyzing obligations...";
              setDisplayStep(compMsg);
              store.setProcessing(compMsg);
            }

            if (event.type === 'error') {
              store.setProcessingError(event.message);
              setErrorMsg(event.message);
              setIsProcessing(false);
              return;
            }
          } catch (e) {
            console.warn("SSE chunk parse warning:", e);
          }
        }
      }

      // After streaming extract completes, run remaining routes in parallel (non-streaming)
      const parallelMsg = "Mapping obligations, timeline & risks in parallel...";
      setDisplayStep(parallelMsg);
      store.setProcessing(parallelMsg);

      const [obligRes, timelineRes, flagsRes] = await Promise.all([
        fetch('/obligations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: contractText, contract_id: cid, ref_date: today }),
        }).then((r) => r.json()),
        fetch('/timeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: contractText, ref_date: today }),
        }).then((r) => r.json()),
        fetch('/flags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: contractText, contract_id: cid, ref_date: today }),
        }).then((r) => r.json()),
      ]);

      store.setObligations(obligRes.obligations || []);
      store.setTimeline(timelineRes.timeline || []);
      store.setFlags(flagsRes.flags || []);

      const briefingMsg = "Generating executive briefing...";
      setDisplayStep(briefingMsg);
      store.setProcessing(briefingMsg);

      const [summaryRes, alertsRes] = await Promise.all([
        fetch('/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: contractText, ref_date: today }),
        }).then((r) => r.json()),
        fetch(`/alerts?today=${today}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: contractText }),
        }).then((r) => r.json()),
      ]);

      store.setSummary(summaryRes);
      store.setAlerts(alertsRes.alerts || alertsRes);

      // All done — unlock the UI
      setIsProcessing(false);
      store.setContractReady({
        name: fileName,
        rawText: contractText,
        id: cid,
        pages: extraData.pages || 1,
        wordCount: extraData.wordCount || contractText.split(/\s+/).length,
      });
    } catch (err) {
      console.error("Stream processing error:", err);
      setErrorMsg(err.message || 'Error occurred during streaming analysis.');
      setIsProcessing(false);
      store.setProcessingError(err.message);
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
      const res = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed (${res.status})`);
      }

      setUploadProgress(85);
      const data = await res.json();
      setUploadProgress(100);

      // Trigger streaming AI pipeline
      await analyzeWithStream(
        data.text,
        file.name,
        'c_' + Date.now(),
        { pages: data.pages || 1, wordCount: data.word_count || 0 }
      );
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process document. Please try a valid PDF or text file.');
      setUploadProgress(0);
      setIsProcessing(false);
    }
  };

  const loadSampleContract = async (version = 1) => {
    setErrorMsg('');
    const filename = version === 1 ? 'Acme_SaaS_MSA_v1.0.pdf' : 'Acme_SaaS_MSA_v2.0_Revised.pdf';
    setUploadingFileName(filename);
    setUploadProgress(40);

    const contractText = version === 1 ? createSampleContractV1() : createSampleContractV2();
    setUploadProgress(100);

    await analyzeWithStream(
      contractText,
      filename,
      'sample_v' + version + '_' + Date.now(),
      { pages: 4, wordCount: contractText.split(/\s+/).length }
    );
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

    store.setContractA(c1);
    store.setContractB(c2);

    // Stream analyze primary contract c1 first, then navigate to compare
    await analyzeWithStream(v1Text, c1.filename, c1.id, { pages: 4 });
    store.setActiveTab('compare');
  };

  const currentDisplayMessage = streamedTokens
    ? `Gemini is reading your contract... (${streamedTokens.length} tokens)`
    : displayStep;

  return (
    <div className="max-w-4xl mx-auto py-8 lg:py-12 flex flex-col items-center">
      {/* Hero Badge & Heading */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-brand-indigo dark:text-indigo-300 text-xs font-semibold mb-6 animate-pulse-subtle">
        <Sparkles className="w-3.5 h-3.5 text-brand-indigo" />
        <span>Gemini 2.5 Pro Contract Intelligence &amp; Live Streaming</span>
      </div>

      <h1 className="text-3xl lg:text-5xl font-extrabold text-center tracking-tight text-zinc-900 dark:text-white mb-4">
        Review Contracts &amp; Track Obligations{' '}
        <span className="bg-gradient-to-r from-brand-indigo via-cyan-500 to-indigo-400 bg-clip-text text-transparent">
          in Real Time
        </span>
      </h1>

      <p className="text-zinc-600 dark:text-zinc-400 text-center max-w-2xl text-sm lg:text-base mb-10 leading-relaxed">
        Upload any enterprise contract or MSA. ContractLens connects directly to Google Gemini 2.5 Pro with token-by-token streaming, maps deadline timelines, isolates obligations, and delivers audit-ready intelligence.
      </p>

      {/* Main Drag-and-Drop Card with Animated Glow Border */}
      <div className="w-full max-w-2xl relative group">
        {/* Animated gradient ring */}
        <div
          className={`absolute -inset-0.5 bg-gradient-to-r from-brand-indigo via-cyan-500 to-indigo-600 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition duration-700 ${
            dragActive || isProcessing ? 'opacity-90 scale-[1.01]' : ''
          }`}
        />

        <div
          onDragEnter={!isProcessing ? handleDrag : undefined}
          onDragLeave={!isProcessing ? handleDrag : undefined}
          onDragOver={!isProcessing ? handleDrag : undefined}
          onDrop={!isProcessing ? handleDrop : undefined}
          onClick={() => {
            if (!isProcessing) fileInputRef.current?.click();
          }}
          className={`relative bg-white dark:bg-[#13192B] rounded-3xl p-8 lg:p-12 flex flex-col items-center justify-center text-center transition-all border shadow-sm ${
            isProcessing
              ? 'cursor-wait border-indigo-500/50 bg-indigo-950/20'
              : dragActive
              ? 'cursor-pointer border-cyan-400 bg-cyan-50/50 dark:bg-slate-800/90'
              : 'cursor-pointer border-slate-200 dark:border-slate-800 hover:border-indigo-400/60 dark:hover:border-indigo-500/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.docx"
            onChange={handleFileChange}
            className="hidden"
            disabled={isProcessing}
          />

          {isProcessing ? (
            /* ACTIVE STREAMING PROCESSING VIEW (Steps B4 & C) */
            <div className="w-full flex flex-col items-center justify-center py-2">
              {/* Spinner */}
              <div className="w-16 h-16 rounded-full border-4 border-indigo-200 dark:border-zinc-800 border-t-brand-indigo animate-spin mb-4" />

              <div className="flex items-center gap-2 mb-1.5">
                <Cpu className="w-4 h-4 text-indigo-400 animate-pulse" />
                <h4 className="font-bold text-zinc-900 dark:text-white text-base">
                  Analyzing Contract with Gemini 2.5 Pro
                </h4>
              </div>

              {/* Dynamic Step / Token Message */}
              <p className="text-xs text-brand-indigo dark:text-indigo-300 font-mono mb-4 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60">
                {currentDisplayMessage}
              </p>

              {/* Shimmering Progress Bar */}
              <div className="w-full max-w-md bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden mb-2">
                <div
                  className="bg-gradient-to-r from-brand-indigo via-cyan-400 to-indigo-600 h-full animate-shimmer"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Step B4 — Live Streaming Preview Panel */}
              {streamedTokens && (
                <div className="mt-4 p-3.5 bg-black/40 dark:bg-black/70 rounded-xl border border-indigo-500/20 max-h-36 overflow-hidden relative w-full max-w-md text-left shadow-inner">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-indigo-400 font-mono flex items-center gap-1.5 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      ⚡ Gemini 2.5 Pro — Live Output
                    </p>
                    <span className="text-[10px] text-zinc-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                      {streamedTokens.length} tokens
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono leading-relaxed line-clamp-4 select-none break-all">
                    {streamedTokens.slice(-400)}
                  </p>
                  {/* fade out bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                </div>
              )}
            </div>
          ) : (
            /* IDLE DROP ZONE VIEW */
            <>
              {/* Upload Icon with Pulse Glow */}
              <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-brand-indigo/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center mb-6 shadow-md group-hover:scale-105 transition-transform">
                <Upload className="w-9 h-9 text-brand-indigo dark:text-cyan-300 transition-colors" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Drag &amp; drop your contract PDF here
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
                Supports PDF, DOCX, and TXT agreements. Fast multi-page text extraction powered by PyMuPDF and analyzed with Google Gemini 2.5 Pro.
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
            </>
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
            disabled={isProcessing}
            className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] hover:border-brand-indigo dark:hover:border-indigo-500/60 p-4 rounded-xl flex items-center justify-between text-left group shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={isProcessing}
            className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] hover:border-cyan-500 dark:hover:border-cyan-500/60 p-4 rounded-xl flex items-center justify-between text-left group shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
