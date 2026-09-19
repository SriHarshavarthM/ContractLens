import React, { useEffect, useState } from 'react';
import { useContractStore } from '../store/useContractStore';
import {
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Loader2,
} from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthModal() {
  const {
    isAuthModalOpen,
    setAuthModal,
    authModalMode,
    login,
    register,
    clearAuthError,
  } = useContractStore();

  const [mode, setMode] = useState(authModalMode || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Senior Legal Counsel');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Reflect the store's requested mode whenever the modal opens or the mode
  // changes, and clear stale messages from a previous session.
  useEffect(() => {
    if (isAuthModalOpen) {
      setMode(authModalMode || 'login');
      setErrorMsg(null);
      setSuccessMsg(null);
      clearAuthError();
    }
  }, [isAuthModalOpen, authModalMode, clearAuthError]);

  if (!isAuthModalOpen) return null;

  const switchMode = (next) => {
    setMode(next);
    setErrorMsg(null);
    setSuccessMsg(null);
    clearAuthError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    clearAuthError();

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      setLoading(false);
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    if (!password) {
      setErrorMsg('Please enter a password.');
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }
    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        setLoading(false);
        return;
      }
    }

    if (mode === 'login') {
      const res = await login(email.trim(), password);
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
      const res = await register(email.trim(), password, name.trim(), role.trim() || 'Contract Analyst');
      if (res.success && res.needsEmailConfirmation) {
        setSuccessMsg(
          'Account created! A confirmation link has been sent to your email. Confirm it, then sign in.'
        );
      } else if (res.success) {
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#141417] rounded-2xl max-w-md w-full border border-zinc-200 dark:border-[#27272A] shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-[#27272A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-brand-indigo font-black text-sm">
              CL
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm">
                ContractLens Authentication
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Secured by Supabase Auth
              </p>
            </div>
          </div>
          <button
            onClick={() => setAuthModal(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
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

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
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
                    disabled={loading}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-indigo disabled:opacity-60"
                  />
                </div>
              </div>
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
                  disabled={loading}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-indigo disabled:opacity-60"
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
                  disabled={loading}
                  className="w-full pl-9 pr-10 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-indigo disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
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
                      disabled={loading}
                      className="w-full pl-9 pr-10 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-indigo disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      tabIndex={-1}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
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
                      disabled={loading}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-indigo disabled:opacity-60"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-brand-indigo hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}