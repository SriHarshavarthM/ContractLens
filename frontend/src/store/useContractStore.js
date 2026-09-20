import { create } from 'zustand';
import {
  supabase,
  mapSupabaseUser,
  getAccessToken,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
} from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const ANALYSIS_STEPS = {
  pending: 'Not analyzed yet',
  running: 'Analysis in progress',
  completed: 'Analysis completed',
  failed: 'Analysis failed',
};

const describeCategory = (key) =>
  ({
    extract: 'Document extraction',
    obligations: 'Obligations & SLAs',
    timeline: 'Timeline',
    flags: 'Risk review',
    summary: 'Executive summary',
    alerts: 'Deadline alerts',
  }[key] || key);

export const useContractStore = create((set, get) => {
  // Collate per-category failures into one honest, stored-status message.
  const summarizeErrors = (errors) => {
    const keys = Object.keys(errors || {}).filter((k) => errors[k]);
    if (keys.length === 0) return null;
    const failed = keys.map((k) => describeCategory(k)).join(', ');
    const details = keys.map((k) => `${describeCategory(k)}: ${errors[k]}`).join(' | ');
    return `Analysis incomplete: ${failed} failed. ${details}`;
  };

  // Shared request helper for a single analysis category. On failure it never
  // returns an empty {} (which would read as "analyzed, nothing found"); it
  // records the error on the category and returns null so the UI can show an
  // honest partial-failure banner with a retry action.
  const runCategoryRequest = async (category, url, body) => {
    try {
      const res = await get().authedFetch(url, { method: 'POST', body: JSON.stringify(body) });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.detail || `Request failed (${res.status})`);
      if (payload && payload.source === 'offline-demo') get().setAiDemoMode(true);
      return payload;
    } catch (e) {
      console.warn(`[analysis] "${category}" failed — not shown as empty:`, e.message || e);
      get().markAnalysisError(category, e.message || 'Request failed');
      return null;
    }
  };

  return {
  // Contracts state
  contracts: [],
  activeContractId: null,
  activeTab: 'library', // 'library', 'upload', 'overview', 'obligations', 'timeline', 'flags', 'clauses', 'compare', 'qa', 'summary', 'alerts'
  contractA: null,
  contractB: null,

  // Current active contract intelligence data
  extractedData: null,
  obligations: [],
  timeline: [],
  flags: [],
  summary: null,
  alerts: null,
  compareDiff: null,

  // Loading & Processing states
  isAnalyzing: false,
  analysisStep: '',
  streamedTokens: '',
  isComparing: false,
  qaLoading: false,
  qaHistory: [],
  // True while /contracts/{id} detail data is being fetched (skeleton state).
  contractLoading: false,
  // Honest error surfaced for the active contract's analysis pipeline.
  contractError: null,
  // Per-category failures for the active contract (category -> message).
  // A category in this map is never presented as an empty successful result.
  analysisErrors: {},
  // Category currently being retried, if any.
  retryingCategory: null,

  // Settings & Configuration
  theme: localStorage.getItem('cl_theme') || 'dark',
  apiKeyConfigured: true,
  isKeyModalOpen: false,
  // True when the backend is in offline demo mode: analysis responses are the
  // tagged sample dataset, not results generated from the submitted document.
  aiDemoMode: false,

  // Authentication State (Supabase Auth)
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isAuthInitializing: true,
  isAuthModalOpen: false,
  authModalMode: 'login',
  authError: null,
  authLoading: false,

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setKeyModalOpen: (open) => set({ isKeyModalOpen: open }),
  setAuthModal: (open, mode = 'login') => set({ isAuthModalOpen: open, authModalMode: mode }),
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('cl_theme', next);
    set({ theme: next });
  },

  // ---------- Supabase Authentication ----------

  restoreSession: async () => {
    try {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (session?.user) {
        set({
          user: mapSupabaseUser(session.user),
          accessToken: session.access_token,
          isAuthenticated: true,
        });
      }
    } catch (e) {
      console.warn('Failed to restore Supabase session:', e);
    } finally {
      set({ isAuthInitializing: false });
    }
  },

  subscribeToAuth: () => {
    if (!supabase) return () => {};
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && session?.access_token) {
        set({
          user: mapSupabaseUser(session.user),
          accessToken: session.access_token,
          isAuthenticated: true,
        });
      } else {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isAuthModalOpen: false,
        });
      }
    });
    return () => data.subscription.unsubscribe();
  },

  login: async (email, password) => {
    if (!supabase) return { success: false, error: 'Supabase is not configured on the frontend. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    set({ authLoading: true, authError: null });
    try {
      const { data, error } = await signInWithEmail(email, password);
      if (error) {
        set({ authLoading: false, authError: error.message });
        return { success: false, error: error.message };
      }
      set({
        user: mapSupabaseUser(data.user),
        accessToken: data.session?.access_token || null,
        isAuthenticated: true,
        authLoading: false,
        isAuthModalOpen: false,
        activeTab: 'library',
      });
      return { success: true };
    } catch (e) {
      set({ authLoading: false, authError: e.message });
      return { success: false, error: e.message };
    }
  },

  register: async (email, password, name, role = 'Contract Analyst') => {
    if (!supabase) return { success: false, error: 'Supabase is not configured on the frontend. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    set({ authLoading: true, authError: null });
    try {
      const { data, error } = await signUpWithEmail({ email, password, name, role });
      if (error) {
        set({ authLoading: false, authError: error.message });
        return { success: false, error: error.message };
      }
      const session = data.session;
      if (session?.user && session?.access_token) {
        set({
          user: mapSupabaseUser(session.user),
          accessToken: session.access_token,
          isAuthenticated: true,
          authLoading: false,
          isAuthModalOpen: false,
          activeTab: 'library',
        });
        return { success: true, needsEmailConfirmation: false };
      }
      set({ authLoading: false });
      return { success: true, needsEmailConfirmation: true };
    } catch (e) {
      set({ authLoading: false, authError: e.message });
      return { success: false, error: e.message };
    }
  },

  logout: async () => {
    if (supabase) {
      try {
        await signOutUser();
      } catch (e) {
        console.warn('Sign-out error:', e);
      }
    }
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isAuthModalOpen: false,
      contracts: [],
      activeContractId: null,
      extractedData: null,
      obligations: [],
      timeline: [],
      flags: [],
      summary: null,
      alerts: null,
      compareDiff: null,
      qaHistory: [],
      contractA: null,
      contractB: null,
      activeTab: 'library',
      aiDemoMode: false,
      contractError: null,
      analysisErrors: {},
      retryingCategory: null,
    });
  },

  clearAuthError: () => set({ authError: null }),
  markSessionExpired: async () => {
    if (!get().isAuthenticated) return;
    const shouldSignOut = !!supabase;
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isAuthModalOpen: false,
      authModalMode: 'login',
      authError: 'Your session has expired. Please sign in again.',
      contracts: [],
      activeContractId: null,
      contractA: null,
      contractB: null,
      extractedData: null,
      obligations: [],
      timeline: [],
      flags: [],
      summary: null,
      alerts: null,
      compareDiff: null,
      qaHistory: [],
      activeTab: 'library',
      aiDemoMode: false,
      contractError: null,
      analysisErrors: {},
      retryingCategory: null,
    });
    if (shouldSignOut) {
      try {
        await signOutUser();
      } catch (e) {
        console.warn('Sign-out after session expiry failed:', e);
      }
    }
  },

  // Streaming & Progressive Loading Setters
  setProcessing: (step) => set({ isAnalyzing: true, analysisStep: step }),
  setProcessingError: (err) => set({ isAnalyzing: false, analysisStep: '', contractError: err }),
  setStreamedTokens: (tokens) => set({ streamedTokens: tokens }),
  setAiDemoMode: (enabled) => set({ aiDemoMode: !!enabled }),
  setExtractedData: (data) =>
    set({ extractedData: data, ...(data && data.source === 'offline-demo' ? { aiDemoMode: true } : {}) }),
  setObligations: (obligations) =>
    set({ obligations: obligations || [], ...(obligations && obligations.source === 'offline-demo' ? { aiDemoMode: true } : {}) }),
  setTimeline: (timeline) =>
    set({ timeline: timeline || [], ...(timeline && timeline.source === 'offline-demo' ? { aiDemoMode: true } : {}) }),
  setFlags: (flags) =>
    set({ flags: flags || [], ...(flags && flags.source === 'offline-demo' ? { aiDemoMode: true } : {}) }),
  setSummary: (summary) =>
    set({ summary: summary || null, ...(summary && summary.source === 'offline-demo' ? { aiDemoMode: true } : {}) }),
  setAlerts: (alerts) =>
    set({ alerts: alerts || null, ...(alerts && alerts.source === 'offline-demo' ? { aiDemoMode: true } : {}) }),

  setContractReady: ({ name, rawText, pages, wordCount, id, contractObj }) => {
    const cid = id || (contractObj && contractObj.id) || ('c_' + Date.now());
    const existingSlice = get().contracts.find((c) => c.id === cid) || {};
    const enriched = {
      ...(contractObj || {}),
      ...existingSlice,
      id: cid,
      filename: name || (contractObj && contractObj.filename) || 'contract.pdf',
      title: (name || (contractObj && contractObj.filename) || 'Contract').replace(/\.[^/.]+$/, ''),
      text: rawText || (contractObj && contractObj.text) || existingSlice.text || '',
      pages: pages || existingSlice.pages || 1,
      wordCount: wordCount || existingSlice.wordCount || (rawText ? rawText.split(/\s+/).length : 0),
      extension: (name || (existingSlice && existingSlice.filename) || 'pdf').split('.').pop(),
      extractedData: get().extractedData,
      obligations: get().obligations,
      timeline: get().timeline,
      flags: get().flags,
      summary: get().summary,
      alerts: get().alerts,
      analysis_status: 'completed',
      analyzedAt: new Date().toISOString(),
      analysisErrors: {},
    };
    const existing = get().contracts.filter((c) => c.id !== enriched.id);
    set({
      contracts: [enriched, ...existing],
      activeContractId: enriched.id,
      contractA: enriched,
      isAnalyzing: false,
      analysisStep: '',
      streamedTokens: '',
      contractError: null,
      activeTab: 'overview',
    });
  },

  // Set active contract and populate its data
  setActiveContract: (contract) => {
    set({
      activeContractId: contract.id,
      extractedData: contract.extractedData || null,
      obligations: contract.obligations || [],
      timeline: contract.timeline || [],
      flags: contract.flags || [],
      summary: contract.summary || null,
      alerts: contract.alerts || null,
      contractError: null,
      analysisErrors: contract.analysisErrors || {},
      retryingCategory: null,
    });
  },

  // Set slots for compare
  setContractA: (contract) => set({ contractA: contract }),
  setContractB: (contract) => set({ contractB: contract }),

  // Calculate Health Score
  getHealthScore: () => {
    const { flags } = get();
    if (!flags || flags.length === 0) return 95;

    let high = 0;
    let med = 0;
    let low = 0;
    flags.forEach((f) => {
      const s = (f.severity || '').toLowerCase();
      if (s === 'high' || s === 'critical') high++;
      else if (s === 'medium') med++;
      else low++;
    });

    const calculated = 100 - (high * 15) - (med * 7) - (low * 3);
    return Math.max(0, Math.min(100, calculated));
  },

  // Persist the analysis lifecycle status for the active/uploaded contract.
  setAnalysisStatus: async (contractId, analysisStatus, analysisError) => {
    if (!contractId) return;
    try {
      await get().authedFetch(`${API_BASE}/contracts/${contractId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ analysis_status: analysisStatus, analysis_error: analysisError || null }),
      });
      set({
        contracts: get().contracts.map((c) =>
          c.id === contractId ? { ...c, analysis_status: analysisStatus, analysis_error: analysisError || null } : c
        ),
      });
      if (get().activeContractId === contractId) {
        set({ contractError: analysisStatus === 'failed' ? analysisError : null });
      }
    } catch (e) {
      console.warn(`Could not persist analysis_status ${analysisStatus} for ${contractId}:`, e);
    }
  },

  // Full AI Analysis Pipeline (Progressive 2-Batch Loading)
  analyzeContract: async (contractObj, autoNavigate = true) => {
    const today = new Date().toISOString().split('T')[0];
    const contractId = contractObj.contract_id || contractObj.id;
    if (!contractId) return { success: false, error: 'No contract id to persist analysis against.' };
    set({
      isAnalyzing: true,
      analysisStep: 'Analyzing terms, obligations & risk clauses...',
      contractError: null,
      analysisErrors: {},
      retryingCategory: null,
    });
    get().setAnalysisStatus(contractId, 'running');

    try {
      // Extract (slowest + most tokens): SSE stream, falling back to the
      // non-stream endpoint. On total failure the category is recorded as an
      // error — never silently converted into an empty result.
      const extractPromise = (async () => {
        try {
          const res = await get().authedFetch(`${API_BASE}/extract/stream`, {
            method: 'POST',
            body: JSON.stringify({
              text: contractObj.text,
              filename: contractObj.filename || 'contract.pdf',
              ref_date: today,
              contract_id: contractId,
            }),
          });
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let rawText = '';
          let accumulated = '';
          let resultData = null;
          let streamError = null;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const raw = decoder.decode(value, { stream: true });
            rawText += raw;
            const lines = raw.split('\n').filter((l) => l.startsWith('data: '));
            for (const line of lines) {
              try {
                const event = JSON.parse(line.replace('data: ', ''));
                if (event.type === 'chunk') {
                  accumulated += event.text;
                  set({
                    streamedTokens: accumulated,
                    analysisStep: `Reading contract... (${accumulated.length} tokens)`,
                  });
                } else if (event.type === 'complete') {
                  resultData = event.data || {};
                } else if (event.type === 'error') {
                  streamError = event.message;
                }
              } catch {
                // ignored: non-SSE line or malformed event
              }
            }
          }
          if (streamError) throw new Error(streamError);
          if (res.status !== 200) {
            let detail = `Extract stream failed (${res.status})`;
            try {
              const j = JSON.parse(rawText);
              if (j && j.detail) detail = j.detail;
            } catch {
              // raw body was not JSON — keep the status-line detail
            }
            throw new Error(detail);
          }
          return resultData || null;
        } catch (e) {
          console.warn('Stream extract failed, falling back to non-stream endpoint:', e.message);
          try {
            const res = await get().authedFetch(`${API_BASE}/extract`, {
              method: 'POST',
              body: JSON.stringify({
                text: contractObj.text,
                filename: contractObj.filename || 'contract.pdf',
                ref_date: today,
                contract_id: contractId,
              }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(payload.detail || `Extract failed (${res.status})`);
            return payload;
          } catch (e2) {
            get().markAnalysisError('extract', e2.message || 'Extract failed');
            return null;
          }
        }
      })();

      // Batch 1 (Parallel): obligations, timeline and risk flags. A failing
      // category returns null and is recorded — never an empty {} that would
      // pretend the analysis succeeded.
      const [extractedData, obData, tlData, flagData] = await Promise.all([
        extractPromise,
        runCategoryRequest('obligations', `${API_BASE}/obligations`, {
          text: contractObj.text,
          ref_date: today,
          contract_id: contractId,
        }),
        runCategoryRequest('timeline', `${API_BASE}/timeline`, {
          text: contractObj.text,
          ref_date: today,
          contract_id: contractId,
        }),
        runCategoryRequest('flags', `${API_BASE}/flags`, {
          text: contractObj.text,
          ref_date: today,
          contract_id: contractId,
        }),
      ]);

      const obligations = obData?.obligations || [];
      const timeline = tlData?.timeline || [];
      const flags = flagData?.flags || [];

      // Immediately unblock user and show Overview
      const initialEnriched = {
        ...contractObj,
        id: contractId,
        extractedData,
        obligations,
        flags,
        timeline,
        summary: null,
        alerts: null,
        analysis_status: 'running',
        analyzedAt: new Date().toISOString(),
        analysisErrors: {},
      };

      const existing = get().contracts.filter((c) => c.id !== initialEnriched.id);
      set({
        contracts: [initialEnriched, ...existing],
        activeContractId: initialEnriched.id,
        contractA: initialEnriched,
        extractedData,
        obligations,
        flags,
        timeline,
        isAnalyzing: false,
        activeTab: autoNavigate ? 'overview' : get().activeTab,
      });

      // Batch 2 (Background): Executive Summary and Proactive Alerts.
      // Awaited so the final status is decided once, truthfully — the
      // background promise can no longer race and overwrite the failure.
      const [summaryResult, alertsResult] = await Promise.all([
        runCategoryRequest('summary', `${API_BASE}/summary`, {
          text: contractObj.text,
          ref_date: today,
          contract_id: contractId,
        }),
        runCategoryRequest('alerts', `${API_BASE}/alerts?today=${today}`, {
          text: contractObj.text,
          contract_id: contractId,
        }),
      ]);

      const mergedSummary = summaryResult || null;
      const mergedAlerts = alertsResult || null;

      // Honest lifecycle: 'completed' ONLY when every category succeeded.
      const analysisErrors = { ...get().analysisErrors };
      const failedCategories = Object.keys(analysisErrors).filter((k) => analysisErrors[k]);
      const analysisError = summarizeErrors(analysisErrors);
      const status = failedCategories.length === 0 ? 'completed' : 'failed';

      const fullyEnriched = {
        ...initialEnriched,
        summary: mergedSummary,
        alerts: mergedAlerts,
        analysis_status: status,
        analysis_error: analysisError,
        analysisErrors,
      };

      const updatedContracts = get().contracts.map((c) =>
        c.id === initialEnriched.id ? fullyEnriched : c
      );
      set({
        contracts: updatedContracts,
        summary: mergedSummary,
        alerts: mergedAlerts,
        analysisStep: '',
        contractError: status === 'failed' ? analysisError : null,
      });
      get().setAnalysisStatus(contractId, status, analysisError);

      return {
        success: status === 'completed',
        error: analysisError,
        partial: failedCategories,
      };
    } catch (err) {
      console.error('Error analyzing contract:', err);
      const message = err.message || 'Analysis failed. Check the backend / Gemini configuration.';
      set({ isAnalyzing: false, analysisStep: '', contractError: message });
      get().setAnalysisStatus(contractId, 'failed', message);
      return { success: false, error: message };
    }
  },

  // Record a single failed analysis category so the UI can surface an honest
  // per-category error with a retry action instead of an empty slice.
  markAnalysisError: (category, message) => {
    if (!message) return;
    set({ analysisErrors: { ...get().analysisErrors, [category]: message } });
  },

  // Clear a category error after a successful retry.
  clearAnalysisError: (category) => {
    const next = { ...get().analysisErrors };
    delete next[category];
    set({ analysisErrors: next });
  },

  // Re-run a single failed analysis category against the persisted contract
  // text. On success the category's data replaces the previous empty/stale
  // slice and the lifecycle status is re-evaluated honestly.
  retryAnalysisCategory: async (category) => {
    const { activeContractId, contracts } = get();
    const contract = contracts.find((c) => c.id === activeContractId);
    if (!contract || !contract.text) {
      return { success: false, error: 'Contract text is not available for retry.' };
    }
    const today = new Date().toISOString().split('T')[0];
    set({
      retryingCategory: category,
      analysisStep: `Retrying ${describeCategory(category)}…`,
      contractError: null,
    });

    let payload = null;
    if (category === 'extract') {
      try {
        const res = await get().authedFetch(`${API_BASE}/extract`, {
          method: 'POST',
          body: JSON.stringify({
            text: contract.text,
            filename: contract.filename || 'contract.pdf',
            ref_date: today,
            contract_id: contract.id,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || `Extract failed (${res.status})`);
        if (data && data.source === 'offline-demo') get().setAiDemoMode(true);
        payload = data;
      } catch (e) {
        get().markAnalysisError('extract', e.message || 'Extract failed');
      }
    } else {
      const urls = {
        obligations: `${API_BASE}/obligations`,
        timeline: `${API_BASE}/timeline`,
        flags: `${API_BASE}/flags`,
        summary: `${API_BASE}/summary`,
        alerts: `${API_BASE}/alerts?today=${today}`,
      };
      const url = urls[category];
      if (!url) {
        set({ retryingCategory: null, analysisStep: '' });
        return { success: false, error: `Unknown analysis category: ${category}` };
      }
      payload = await runCategoryRequest(category, url, {
        text: contract.text,
        ref_date: today,
        contract_id: contract.id,
      });
    }

    if (payload) {
      const patch = {};
      if (category === 'obligations') patch.obligations = payload.obligations || [];
      else if (category === 'timeline') patch.timeline = payload.timeline || [];
      else if (category === 'flags') patch.flags = payload.flags || [];
      else if (category === 'summary') patch.summary = payload;
      else if (category === 'alerts') patch.alerts = payload;
      else if (category === 'extract') patch.extractedData = payload;
      const latest = get().contracts.find((c) => c.id === contract.id) || contract;
      const updated = { ...latest, ...patch };
      set({
        contracts: get().contracts.map((c) => (c.id === updated.id ? updated : c)),
        ...patch,
      });
      get().clearAnalysisError(category);
    }

    const remaining = Object.keys(get().analysisErrors).filter((k) => get().analysisErrors[k]);
    const analysisError = summarizeErrors(get().analysisErrors);
    const status = remaining.length === 0 ? 'completed' : 'failed';
    set({
      contracts: get().contracts.map((c) =>
        c.id === contract.id ? { ...c, analysis_status: status, analysis_error: analysisError } : c
      ),
      contractError: status === 'failed' && get().activeContractId === contract.id ? analysisError : null,
      isAnalyzing: false,
      analysisStep: '',
      retryingCategory: null,
    });
    get().setAnalysisStatus(contract.id, status, analysisError);
    return { success: status === 'completed' };
  },

  // Re-run the full analysis for an already-persisted contract.
  reanalyzeContract: async (contractId) => {
    const found = get().contracts.find((c) => c.id === contractId);
    const text = found?.text || '';
    if (!text) {
      try {
        const res = await get().authedFetch(`${API_BASE}/contracts/${contractId}`);
        const detail = await res.json();
        const loaded = { ...detail, text: detail.raw_text || '' };
        if (!loaded.text) return { success: false, error: 'Contract text is not available for re-analysis.' };
        return get().analyzeContract({
          ...loaded,
          id: contractId,
          text: loaded.text,
          filename: detail.name || 'contract.pdf',
        });
      } catch {
        return { success: false, error: 'Could not load contract text for re-analysis.' };
      }
    }
    return get().analyzeContract({ ...found, text });
  },

  authHeaders: async () => {
    const base = { 'Content-Type': 'application/json' };
    const token = await getAccessToken();
    if (token) return { ...base, Authorization: `Bearer ${token}` };
    return base;
  },

  // Shared authed fetch: adds the verified user's bearer token, preserves
  // multipart uploads (Content-Type is left to the browser for FormData
  // bodies), and treats HTTP 401 as an expired/rejected session.
  authedFetch: async (resource, options = {}) => {
    const auth = await get().authHeaders();
    const isMultipart = options.body instanceof FormData;
    const headers = { ...(options.headers || {}) };
    if (auth.Authorization) headers.Authorization = auth.Authorization;
    if (!isMultipart && auth['Content-Type']) headers['Content-Type'] = auth['Content-Type'];
    const res = await fetch(resource, { ...options, headers });
    if (res.status === 401) get().markSessionExpired();
    return res;
  },

  // Supabase Contract Repository Persistence Methods
  fetchContracts: async () => {
    try {
      const res = await get().authedFetch(`${API_BASE}/contracts`);
      if (!res.ok) return;
      const remoteList = await res.json();
      if (Array.isArray(remoteList) && remoteList.length > 0) {
        const currentContracts = get().contracts;
        const merged = [...currentContracts];
        for (const remote of remoteList) {
          const idx = merged.findIndex(c => c.id === remote.id);
          const base = {
            id: remote.id,
            title: remote.name ? remote.name.replace(/\.[^/.]+$/, '') : 'Contract Document',
            filename: remote.name || 'contract.pdf',
            extension: (remote.name || 'pdf').split('.').pop(),
            status: remote.status || 'active',
            uploaded_at: remote.uploaded_at,
            health_score: remote.health_score || 78,
            text: remote.raw_text || '',
            pages: remote.pages || 1,
            word_count: remote.word_count || 0,
            file_type: remote.file_type || (remote.name || '').split('.').pop() || '',
            file_size_bytes: remote.file_size_bytes,
            document_type: remote.document_type || '',
            analysis_status: remote.analysis_status || 'pending',
            analysis_error: remote.analysis_error || null,
            analyzed_at: remote.analyzed_at || null,
            analysisErrors: {},
            obligations: [],
            flags: [],
            timeline: remote.timeline || [],
            summary: remote.summary || null,
            alerts: remote.alerts || null,
          };
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...base, title: base.title || merged[idx].title };
          } else {
            merged.push(base);
          }
        }
        set({ contracts: merged });
        // Restore the most recent contract fully (child-table data + analysis)
        // so the saved analysis is visible right after sign-in / reload.
        if (!get().activeContractId && merged.length > 0) {
          get().loadContractById(merged[0].id);
        }
      }
    } catch (e) {
      console.warn('Could not fetch contracts from Supabase:', e);
    }
  },

  loadContractById: async (contractId) => {
    set({ contractLoading: true });
    try {
      const res = await get().authedFetch(`${API_BASE}/contracts/${contractId}`);
      if (!res.ok) {
        const found = get().contracts.find(c => c.id === contractId);
        if (found) get().setActiveContract(found);
        return;
      }
      const data = await res.json();
      const updated = {
        id: data.id,
        title: data.name ? data.name.replace(/\.[^/.]+$/, '') : 'Contract Document',
        filename: data.name || 'contract.pdf',
        extension: (data.name || 'pdf').split('.').pop(),
        text: data.raw_text || '',
        status: data.status,
        uploaded_at: data.uploaded_at,
        document_type: data.document_type || '',
        file_type: data.file_type || (data.name || '').split('.').pop() || '',
        pages: data.pages || 1,
        word_count: data.word_count || 0,
        file_size_bytes: data.file_size_bytes,
        analysis_status: data.analysis_status || 'pending',
        analysis_error: data.analysis_error || null,
        analyzed_at: data.analyzed_at || null,
        analysisErrors: {},
        extractedData: data.extractedData,
        obligations: data.obligations || [],
        flags: data.flags || [],
        timeline: data.timeline || [],
        summary: data.summary || null,
        alerts: data.alerts || null,
      };
      const existing = get().contracts.filter(c => c.id !== data.id);
      set({
        contracts: [updated, ...existing],
        activeContractId: updated.id,
        extractedData: updated.extractedData,
        obligations: updated.obligations,
        timeline: updated.timeline,
        flags: updated.flags,
        summary: updated.summary,
        alerts: updated.alerts,
        contractError: updated.analysis_status === 'failed' ? updated.analysis_error : null,
        aiDemoMode: false,
      });
    } catch (e) {
      console.error('Error loading contract from Supabase:', e);
      const found = get().contracts.find(c => c.id === contractId);
      if (found) get().setActiveContract(found);
    } finally {
      set({ contractLoading: false });
    }
  },

  deleteContract: async (contractId) => {
    try {
      await get().authedFetch(`${API_BASE}/contracts/${contractId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Error deleting on backend:', e);
    }
    const remaining = get().contracts.filter(c => c.id !== contractId);
    const wasActive = get().activeContractId === contractId;
    set({
      contracts: remaining,
      activeContractId: wasActive ? (remaining[0]?.id || null) : get().activeContractId,
    });
    if (wasActive && remaining.length > 0) {
      get().setActiveContract(remaining[0]);
    } else if (remaining.length === 0) {
      set({
        extractedData: null,
        obligations: [],
        flags: [],
        timeline: [],
        summary: null,
        alerts: null,
        activeTab: 'library',
      });
    } else if (wasActive) {
      set({ activeTab: 'library' });
    }
  },

  // Perform Comparison between contractA and contractB
  runComparison: async () => {
    const { contractA, contractB } = get();
    if (!contractA || !contractB) return;

    set({ isComparing: true });
    try {
      const res = await get().authedFetch(`${API_BASE}/compare`, {
        method: 'POST',
        body: JSON.stringify({
          contract_a: contractA.text,
          contract_b: contractB.text,
          contract_a_title: contractA.title || contractA.filename || 'Version 1.0',
          contract_b_title: contractB.title || contractB.filename || 'Version 2.0',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Comparison failed');
      set({ compareDiff: data, isComparing: false });
    } catch (err) {
      console.error('Compare failed:', err);
      set({ compareDiff: null, isComparing: false, contractError: 'Comparison failed.' });
    }
  },

  // Natural language Q&A
  askQuestion: async (question) => {
    const { contracts, activeContractId, qaHistory } = get();
    const activeContract = contracts.find((c) => c.id === activeContractId);
    if (!activeContract) return;

    set({ qaLoading: true });
    try {
      const historyPayload = qaHistory.map((h) => ({
        role: 'user',
        content: h.question,
      }));

      const res = await get().authedFetch(`${API_BASE}/qa`, {
        method: 'POST',
        body: JSON.stringify({
          contract_text: activeContract.text,
          question,
          history: historyPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Q&A failed (${res.status})`);

      const newEntry = {
        id: Date.now().toString(),
        question,
        answer: data.answer,
        confidence: data.confidence || 'High',
        sources: Array.isArray(data.sources) ? data.sources : [],
        caveat: data.caveat || null,
        source_section: data.source_section,
        source_text: data.source_text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      set({
        qaHistory: [...qaHistory, newEntry],
        qaLoading: false,
      });
    } catch (err) {
      console.error('QA request failed:', err);
      set({ qaLoading: false, contractError: 'Q&A failed: ' + err.message });
    }
  },

  clearQAHistory: () => set({ qaHistory: [] }),

  // Health check and backend API key status
  checkBackendHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      const data = await res.json();
      set({ apiKeyConfigured: data.gemini_configured, aiDemoMode: !!data.fallback_mode });
    } catch (e) {
      console.warn('Backend not responding to health check yet:', e);
    }
  },

  // Save API key
  saveApiKey: async (key) => {
    try {
      const res = await get().authedFetch(`${API_BASE}/config/key`, {
        method: 'POST',
        body: JSON.stringify({ api_key: key }),
      });
      const data = await res.json();
      set({ apiKeyConfigured: data.gemini_configured, aiDemoMode: !data.gemini_configured });
      return true;
    } catch (e) {
      console.error('Failed to save key:', e);
      return false;
    }
  },
  };
});

export { ANALYSIS_STEPS };