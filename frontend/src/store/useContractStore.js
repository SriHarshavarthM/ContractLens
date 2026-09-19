import { create } from 'zustand';

const API_BASE = 'http://localhost:8000';

export const useContractStore = create((set, get) => ({
  // Contracts state
  contracts: [], // list of uploaded/loaded contracts
  activeContractId: null,
  activeTab: 'upload', // 'upload', 'overview', 'obligations', 'timeline', 'flags', 'compare', 'qa', 'summary', 'alerts'
  
  // Specific slots for Compare view
  contractA: null, // { id, title, text, filename }
  contractB: null, // { id, title, text, filename }

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
  analysisStep: '', // e.g. "Extracting metadata...", "Flagging risks..."
  streamedTokens: '',
  isComparing: false,
  qaLoading: false,
  qaHistory: [], // [{ id, question, answer, confidence, source_section, source_text, timestamp }]

  // Settings & Configuration
  theme: localStorage.getItem('cl_theme') || 'dark',
  apiKeyConfigured: true,
  isKeyModalOpen: false,

  // User & Authentication State
  user: JSON.parse(localStorage.getItem('cl_user') || 'null') || {
    id: 'usr_demo_01',
    name: 'Panji Dwi',
    email: 'demo@contractlens.ai',
    role: 'Lead Legal Counsel & Contract Manager',
    employee_id: '#EMP07',
    avatar_initials: 'PD',
  },
  token: localStorage.getItem('cl_token') || 'cl_demo_token',
  isAuthenticated: true,
  isAuthModalOpen: false,
  authModalMode: 'login', // 'login' | 'register'

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setKeyModalOpen: (open) => set({ isKeyModalOpen: open }),
  setAuthModal: (open, mode = 'login') => set({ isAuthModalOpen: open, authModalMode: mode }),

  // Streaming & Progressive Loading Setters
  setProcessing: (step) => set({ isAnalyzing: true, analysisStep: step }),
  setProcessingError: (err) => set({ isAnalyzing: false, analysisStep: '', errorMsg: err }),
  setStreamedTokens: (tokens) => set({ streamedTokens: tokens }),
  setExtractedData: (data) => set({ extractedData: data }),
  setObligations: (obligations) => set({ obligations: obligations || [] }),
  setTimeline: (timeline) => set({ timeline: timeline || [] }),
  setFlags: (flags) => set({ flags: flags || [] }),
  setSummary: (summary) => set({ summary: summary || null }),
  setAlerts: (alerts) => set({ alerts: alerts || null }),
  setContractReady: ({ name, rawText, pages, wordCount, id, contractObj }) => {
    const cid = id || (contractObj && contractObj.id) || ('c_' + Date.now());
    const enriched = {
      ...(contractObj || {}),
      id: cid,
      filename: name || (contractObj && contractObj.filename) || 'contract.pdf',
      title: (name || (contractObj && contractObj.filename) || 'Contract').replace(/\.[^/.]+$/, ''),
      text: rawText || (contractObj && contractObj.text) || '',
      pages: pages || (contractObj && contractObj.pages) || 1,
      wordCount: wordCount || (contractObj && contractObj.wordCount) || (rawText ? rawText.split(/\s+/).length : 0),
      extractedData: get().extractedData,
      obligations: get().obligations,
      timeline: get().timeline,
      flags: get().flags,
      summary: get().summary,
      alerts: get().alerts,
      analyzedAt: new Date().toISOString(),
    };
    const existing = get().contracts.filter((c) => c.id !== enriched.id);
    set({
      contracts: [enriched, ...existing],
      activeContractId: enriched.id,
      contractA: enriched,
      isAnalyzing: false,
      analysisStep: '',
      streamedTokens: '',
      activeTab: 'overview',
    });
  },

  loginDemo: async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@contractlens.ai', password: 'demo123' })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('cl_token', data.token);
        localStorage.setItem('cl_user', JSON.stringify(data.user));
        set({ user: data.user, token: data.token, isAuthenticated: true, isAuthModalOpen: false });
        return { success: true };
      }
    } catch (e) {
      // Offline fallback
      const demo = {
        id: 'usr_demo_01',
        name: 'Panji Dwi',
        email: 'demo@contractlens.ai',
        role: 'Lead Legal Counsel & Contract Manager',
        employee_id: '#EMP07',
        avatar_initials: 'PD',
      };
      localStorage.setItem('cl_token', 'cl_demo_token');
      localStorage.setItem('cl_user', JSON.stringify(demo));
      set({ user: demo, token: 'cl_demo_token', isAuthenticated: true, isAuthModalOpen: false });
      return { success: true };
    }
  },

  login: async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.detail || 'Login failed' };
      }
      localStorage.setItem('cl_token', data.token);
      localStorage.setItem('cl_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isAuthenticated: true, isAuthModalOpen: false });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message || 'Connection failed' };
    }
  },

  register: async (name, email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.detail || 'Registration failed' };
      }
      localStorage.setItem('cl_token', data.token);
      localStorage.setItem('cl_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isAuthenticated: true, isAuthModalOpen: false });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message || 'Connection failed' };
    }
  },

  logout: () => {
    localStorage.removeItem('cl_token');
    localStorage.removeItem('cl_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isAuthModalOpen: true,
      authModalMode: 'login'
    });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('cl_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme: next });
  },
  setTheme: (t) => {
    localStorage.setItem('cl_theme', t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme: t });
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
      activeTab: 'overview',
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

  // Full AI Analysis Pipeline triggered after document upload/load (Progressive 2-Batch Loading)
  analyzeContract: async (contractObj, autoNavigate = true) => {
    const today = new Date().toISOString().split('T')[0];
    const contractId = contractObj.contract_id || contractObj.id;
    set({ isAnalyzing: true, analysisStep: 'Analyzing terms, obligations & risk clauses...' });

    try {
      // Stream extract (slowest + most tokens) with live token tracking
      const extractStreamPromise = (async () => {
        try {
          const res = await fetch(`${API_BASE}/extract/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: contractObj.text,
              filename: contractObj.filename || 'contract.pdf',
              ref_date: today,
              contract_id: contractId,
            }),
          });
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';
          let resultData = null;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const raw = decoder.decode(value, { stream: true });
            const lines = raw.split('\n').filter((l) => l.startsWith('data: '));
            for (const line of lines) {
              try {
                const event = JSON.parse(line.replace('data: ', ''));
                if (event.type === 'chunk') {
                  accumulated += event.text;
                  set({
                    streamedTokens: accumulated,
                    analysisStep: `Gemini is reading your contract... (${accumulated.length} tokens)`,
                  });
                } else if (event.type === 'complete') {
                  resultData = event.data;
                }
              } catch (e) {}
            }
          }
          return resultData || {};
        } catch (e) {
          // Fallback to regular extract if stream had error
          const res = await fetch(`${API_BASE}/extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: contractObj.text,
              filename: contractObj.filename || 'contract.pdf',
              ref_date: today,
              contract_id: contractId,
            }),
          });
          return await res.json();
        }
      })();

      // Batch 1 (Parallel): Core extraction, obligations, and risk flags
      const [extractedData, obData, flagData] = await Promise.all([
        extractStreamPromise,
        fetch(`${API_BASE}/obligations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: contractObj.text, ref_date: today, contract_id: contractId }),
        }).then((r) => r.json()),
        fetch(`${API_BASE}/flags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: contractObj.text, ref_date: today, contract_id: contractId }),
        }).then((r) => r.json()),
      ]);

      const obligations = obData.obligations || [];
      const flags = flagData.flags || [];

      // Immediately unblock user and show Overview
      const initialEnriched = {
        ...contractObj,
        id: contractId || contractObj.id,
        extractedData,
        obligations,
        flags,
        timeline: [],
        summary: null,
        alerts: null,
        analyzedAt: new Date().toISOString(),
      };

      const existing = get().contracts.filter((c) => c.id !== initialEnriched.id);
      set({
        contracts: [initialEnriched, ...existing],
        activeContractId: initialEnriched.id,
        contractA: initialEnriched,
        extractedData,
        obligations,
        flags,
        isAnalyzing: false, // unblock modal immediately
        activeTab: autoNavigate ? 'overview' : get().activeTab,
      });

      // Batch 2 (Background): Timeline, Executive Summary, Proactive Alerts
      Promise.all([
        fetch(`${API_BASE}/timeline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: contractObj.text, ref_date: today }),
        }).then(r => r.json()),
        fetch(`${API_BASE}/summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: contractObj.text, ref_date: today }),
        }).then(r => r.json()),
        fetch(`${API_BASE}/alerts?today=${today}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: contractObj.text }),
        }).then(r => r.json()),
      ]).then(([tlData, summary, alerts]) => {
        const timeline = tlData.timeline || [];
        const fullyEnriched = {
          ...initialEnriched,
          timeline,
          summary,
          alerts,
        };
        const updatedContracts = get().contracts.map((c) =>
          c.id === initialEnriched.id ? fullyEnriched : c
        );
        set({
          contracts: updatedContracts,
          timeline,
          summary,
          alerts,
        });
      }).catch(err => {
        console.warn('Batch 2 background processing note:', err);
      });

      return { success: true };
    } catch (err) {
      console.error('Error analyzing contract:', err);
      set({ isAnalyzing: false, analysisStep: '' });
      return { success: false, error: err.message };
    }
  },

  // Supabase Contract Repository Persistence Methods
  fetchContracts: async () => {
    try {
      const res = await fetch(`${API_BASE}/contracts`);
      if (!res.ok) return;
      const remoteList = await res.json();
      if (Array.isArray(remoteList) && remoteList.length > 0) {
        const currentContracts = get().contracts;
        const merged = [...currentContracts];
        for (const remote of remoteList) {
          const idx = merged.findIndex(c => c.id === remote.id);
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...remote, title: remote.name || merged[idx].title };
          } else {
            merged.push({
              id: remote.id,
              title: remote.name || 'Contract Document',
              filename: remote.name || 'contract.pdf',
              status: remote.status || 'active',
              uploaded_at: remote.uploaded_at,
              health_score: remote.health_score || 78,
              text: remote.raw_text || '',
              pages: 1,
              obligations: [],
              flags: [],
              timeline: [],
              summary: null,
              alerts: null,
            });
          }
        }
        set({ contracts: merged });
        if (!get().activeContractId && merged.length > 0) {
          get().setActiveContract(merged[0]);
        }
      }
    } catch (e) {
      console.warn('Could not fetch contracts from Supabase:', e);
    }
  },

  loadContractById: async (contractId) => {
    try {
      const res = await fetch(`${API_BASE}/contracts/${contractId}`);
      if (!res.ok) {
        const found = get().contracts.find(c => c.id === contractId);
        if (found) get().setActiveContract(found);
        return;
      }
      const data = await res.json();
      const updated = {
        id: data.id,
        title: data.name,
        filename: data.name,
        text: data.raw_text,
        status: data.status,
        uploaded_at: data.uploaded_at,
        extractedData: data.extractedData,
        obligations: data.obligations || [],
        flags: data.flags || [],
        timeline: [],
        summary: null,
        alerts: null,
      };
      const existing = get().contracts.filter(c => c.id !== data.id);
      set({
        contracts: [updated, ...existing],
        activeContractId: updated.id,
        extractedData: updated.extractedData,
        obligations: updated.obligations,
        flags: updated.flags,
        activeTab: 'overview',
      });
    } catch (e) {
      console.error('Error loading contract from Supabase:', e);
      const found = get().contracts.find(c => c.id === contractId);
      if (found) get().setActiveContract(found);
    }
  },

  deleteContract: async (contractId) => {
    try {
      await fetch(`${API_BASE}/contracts/${contractId}`, { method: 'DELETE' });
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
        activeTab: 'upload',
      });
    }
  },


  // Perform Comparison between contractA and contractB
  runComparison: async () => {
    const { contractA, contractB } = get();
    if (!contractA || !contractB) return;

    set({ isComparing: true });
    try {
      const res = await fetch(`${API_BASE}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_a: contractA.text,
          contract_b: contractB.text,
          contract_a_title: contractA.title || contractA.filename || 'Version 1.0',
          contract_b_title: contractB.title || contractB.filename || 'Version 2.0',
        }),
      });
      const data = await res.json();
      set({ compareDiff: data, isComparing: false });
    } catch (err) {
      console.error('Compare failed:', err);
      set({ isComparing: false });
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

      const res = await fetch(`${API_BASE}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_text: activeContract.text,
          question,
          history: historyPayload,
        }),
      });
      const data = await res.json();

      const newEntry = {
        id: Date.now().toString(),
        question,
        answer: data.answer,
        confidence: data.confidence || 'High',
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
      set({ qaLoading: false });
    }
  },

  clearQAHistory: () => set({ qaHistory: [] }),

  // Health check and backend API key status
  checkBackendHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      const data = await res.json();
      set({ apiKeyConfigured: data.gemini_configured });
    } catch (e) {
      console.warn('Backend not responding to health check yet:', e);
    }
  },

  // Save API key
  saveApiKey: async (key) => {
    try {
      const res = await fetch(`${API_BASE}/config/key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key }),
      });
      const data = await res.json();
      set({ apiKeyConfigured: data.gemini_configured });
      return true;
    } catch (e) {
      console.error('Failed to save key:', e);
      return false;
    }
  },
}));
