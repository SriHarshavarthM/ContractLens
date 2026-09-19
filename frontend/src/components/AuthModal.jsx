import React, { useState } from 'react';
import { useContractStore } from '../store/useContractStore';
import {
  User,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Briefcase
} from 'lucide-react';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    setAuthModal,
    authModalMode,
    login,
    register,
    loginDemo,
    isAuthenticated,
    user
  } = useContractStore();

  const [mode, setMode] = useState(authModalMode || 'login');
  const [email, setEmail] = useState('demo@contractlens.ai');
  const [password, setPassword] = useState('demo123');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Senior Legal Counsel');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isAuthModalOpen) return null;

  const handleDemoLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginDemo();
      if (res.success) {
        setSuccessMsg('Logged in successfully as Demo User (Panji Dwi)!');
        setTimeout(() => {
          setSuccessMsg(null);
          setAuthModal(false);
        }, 1000);
      }
    } catch (err) {
      setErrorMsg('Failed to log in with demo credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (mode === 'login') {
      const res = await login(email, password);
      if (res.success) {
        setSuccessMsg('Welcome back!');
        setTimeout(() => {
          setSuccessMsg(null);
          setAuthModal(false);
        }, 1000);
      } else {
        setErrorMsg(res.error || 'Invalid email or password.');
      }
    } else {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name.');
        setLoading(false);
        return;
      }
      const res = await register(name, email, password);
      if (res.success) {
        setSuccessMsg('Account registered and logged in successfully!');
        setTimeout(() => {
          setSuccessMsg(null);
          setAuthModal(false);
        }, 1200);
      } else {
        setErrorMsg(res.error || 'Failed to create account.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#13192B] rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Header with Title and Close Button */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-brand-indigo font-black text-sm">
              CL
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                ContractLens Authentication
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Enterprise AI Contract Review &amp; Obligation Intelligence
              </p>
            </div>
          </div>

          <button
            onClick={() => setAuthModal(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {/* 1-Click Demo User Access Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Demo Access</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 font-semibold font-mono">
                demo@contractlens.ai
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              Use pre-configured demo account with lead counsel permissions and sample contracts:
            </p>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sign In as Demo User (1-Click)</span>
            </button>
          </div>

          {/* Mode Switcher Tabs (Sign In / Register) */}
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#181E2E] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(null); }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#181E2E] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Notifications */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Professional Role
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. General Counsel / Legal Operations"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#181E2E] dark:bg-white text-white dark:text-slate-950 font-bold text-xs shadow hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <span>{mode === 'login' ? 'Sign In to ContractLens' : 'Create & Access Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
