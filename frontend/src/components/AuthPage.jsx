import React, { useState } from 'react';
import { useContractStore } from '../store/useContractStore';
import { supabase } from '../lib/supabase';
import {
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Loader2,
} from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthPage() {
  const store = useContractStore();
  const { login, register, authLoading, authError, clearAuthError } = store;

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Senior Legal Counsel');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState(null);
  const [noticeMsg, setNoticeMsg] = useState(null);

  const switchMode = (next) => {
    setMode(next);
    setFormError(null);
    setNoticeMsg(null);
    clearAuthError();
  };

  const validate = () => {
    if (!email.trim()) return 'Please enter your email address.';
    if (!EMAIL_RE.test(email.trim())) return 'Please enter a valid email address.';
    if (!password) return 'Please enter a password.';
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    if (mode === 'register') {
      if (!name.trim()) return 'Please enter your full name.';
      if (password !== confirmPassword) return 'Passwords do not match.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setNoticeMsg(null);
    clearAuthError();

    const invalid = validate();
    if (invalid) {
      setFormError(invalid);
      return;
    }

    if (mode === 'login') {
      const res = await login(email.trim(), password);
      if (!res.success) {
        setFormError(res.error || 'Invalid email or password.');
      }
    } else {
      const res = await register(email.trim(), password, name.trim(), role.trim() || 'Contract Analyst');
      if (res.success && res.needsEmailConfirmation) {
        setNoticeMsg(
          'Your account was created. A confirmation link has been sent to your email — click it, then sign in below.'
        );
      } else if (!res.success) {
        setFormError(res.error || 'Failed to create account.');
      }
    }
  };

  if (!supabase) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#141417] rounded-2xl border border-zinc-200 dark:border-[#27272A] p-8 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-brand-indigo flex items-center justify-center text-white font-black text-sm mx-auto mb-4">
            CL
          </div>
          <h1 className="font-bold text-zinc-900 dark:text-white text-lg mb-2">Supabase not configured</h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            ContractLens requires Supabase Auth to sign in and use the application. Add{' '}
            <span className="font-mono text-brand-indigo">VITE_SUPABASE_URL</span> and{' '}
            <span className="font-mono text-brand-indigo">VITE_SUPABASE_ANON_KEY</span> to{' '}
            <span className="font-mono">frontend/.env</span>, then restart the frontend.
          </p>
          <div className="text-[11px] p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Until Supabase is configured, no account can be created and uploads, analysis, and data access are unavailable.</span>
          </div>
        </div>
      </div>
    );
  }

  const inputCls =
    'w-full pl-9 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-indigo disabled:opacity-60';

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex antialiased items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-indigo flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/20">
            CL
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-white leading-tight">
              Contract<span className="text-brand-indigo">Lens</span>
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono tracking-wider">
              ENTERPRISE AI CONTRACT INTELLIGENCE
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#141417] rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-2xl overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-5 border-b border-zinc-100 dark:border-[#27272A] text-center">
            <h1 className="font-bold text-zinc-900 dark:text-white text-lg">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {mode === 'login'
                ? 'Sign in to review contracts, track obligations, and monitor deadlines.'
                : 'Start analyzing contracts with Gemini 2.5 Pro streaming.'}
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Mode Switcher */}
            <div className="flex p-1 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs font-semibold">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-white dark:bg-[#222226] text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  mode === 'register'
                    ? 'bg-white dark:bg-[#222226] text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Notifications */}
            {(formError || authError) && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError || authError}</span>
              </div>
            )}

            {noticeMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{noticeMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sarah Jenkins"
                        disabled={authLoading}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    disabled={authLoading}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    disabled={authLoading}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        disabled={authLoading}
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        tabIndex={-1}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Professional Role
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g. General Counsel / Legal Operations"
                        disabled={authLoading}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-brand-indigo hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In to ContractLens' : 'Create Account'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Authentication powered by Supabase Auth</span>
          <Sparkles className="w-3 h-3 text-brand-indigo" />
        </div>
      </div>
    </div>
  );
}