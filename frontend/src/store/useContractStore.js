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
    set({ isAnalyzing: true, analysisStep: 'Analyzing terms, obligations & risk clauses...' });

    try {
      // Batch 1 (Parallel): Core extraction, obligations, and risk flags
      const [extractRes, obRes, flagRes] = await Promise.all([
        fetch(`${API_BASE}/extract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: contractObj.text,
            filename: contractObj.filename || 'contract.pdf',
            ref_date: today,
          }),
        }),
        fetch(`${API_BASE}/obligations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: contractObj.text, ref_date: today }),
        }),
        fetch(`${API_BASE}/flags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: contractObj.text, ref_date: today }),
        })
      ]);

      const extractedData = await extractRes.json();
      const obData = await obRes.json();
      const flagData = await flagRes.json();

      const obligations = obData.obligations || [];
      const flags = flagData.flags || [];

      // Immediately unblock user and show Overview
      const initialEnriched = {
        ...contractObj,
        extractedData,
        obligations,
        flags,
        timeline: [],
        summary: null,
        alerts: null,
        analyzedAt: new Date().toISOString(),
      };

      const existing = get().contracts.filter((c) => c.id !== contractObj.id);
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
