/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  KeyRound, 
  ArrowLeft,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'login' | 'register' | 'forgot';
  initialMode?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  mode: propMode,
  initialMode = 'login',
}) => {
  const { 
    login, 
    register, 
    sendMagicLink, 
    loginAnonymously, 
    requestPasswordReset, 
    resetPassword,
    isSupabaseConnected,
  } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(propMode || initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [resetEmailLoading, setResetEmailLoading] = useState(false);

  // Sync mode if propMode changes
  useEffect(() => {
    if (propMode) {
      setMode(propMode);
    }
  }, [propMode]);

  // Reset transient error and messages when mode switches
  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    setError(null);
    setInfoMessage(null);
  };

  if (!isOpen) return null;

  const handleSendMagicLink = async () => {
    if (!email.trim()) {
      setError('Please enter your email address to receive a magic link.');
      return;
    }
    setError(null);
    setInfoMessage(null);
    setMagicLoading(true);

    try {
      const res = await sendMagicLink(email.trim());
      if (res.success) {
        setInfoMessage('Magic link sent! Check your inbox to sign in instantly.');
      } else {
        setError(res.error || 'Failed to send magic link.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send magic link.');
    } finally {
      setMagicLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!email.trim()) {
      setError('Please enter your email address to receive reset instructions.');
      return;
    }
    setError(null);
    setInfoMessage(null);
    setResetEmailLoading(true);

    try {
      const res = await requestPasswordReset(email.trim());
      if (res.success) {
        setInfoMessage(res.message || t('auth.resetEmailSent'));
      } else {
        setError(res.error || 'Failed to send reset link.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset link.');
    } finally {
      setResetEmailLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(email.trim(), newPassword);
      if (res.success) {
        setInfoMessage(t('auth.resetSuccess'));
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.error || 'Password reset failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Login failed. Please check credentials.');
        }
      } else if (mode === 'register') {
        const res = await register(email, fullName, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Registration failed.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      await loginAnonymously('Guest Friend');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to start guest session');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-md bg-[#0e1320] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 relative overflow-hidden my-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close auth dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Auth Engine Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-slate-950/80 border-slate-800">
            {isSupabaseConnected ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Supabase Cloud Auth Active</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Secure Password Auth (SHA-256)</span>
              </span>
            )}
          </div>
        </div>

        {/* Tab Switcher (Only visible for Login / Register) */}
        {mode !== 'forgot' ? (
          <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-6 max-w-[240px]">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'login' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('nav.signIn')}
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'register' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('auth.createButton')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-300 font-medium mb-4 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('auth.backToSignIn')}</span>
          </button>
        )}

        {/* Title Header */}
        <div className="flex items-center gap-2">
          {mode === 'forgot' && (
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
          )}
          <h2 id="auth-modal-title" className="text-xl font-display font-bold text-white">
            {mode === 'login' 
              ? t('auth.signInTitle') 
              : mode === 'register' 
              ? t('auth.registerTitle') 
              : t('auth.resetTitle')}
          </h2>
        </div>

        <p className="text-xs text-slate-400 mt-1">
          {mode === 'login' 
            ? t('auth.signInDesc') 
            : mode === 'register' 
            ? t('auth.registerDesc') 
            : t('auth.resetDesc')}
        </p>

        {/* Feedback Alerts */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* FORGOT PASSWORD VIEW */}
        {mode === 'forgot' ? (
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            {/* Action 1: Send Reset Link via Email */}
            <button
              type="button"
              onClick={handleSendResetEmail}
              disabled={resetEmailLoading}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-emerald-500/40 text-slate-200 font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>{resetEmailLoading ? 'Sending...' : t('auth.sendResetLink')}</span>
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800/80" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="bg-[#0e1320] px-2 text-slate-500 font-medium">
                  Or set new password directly
                </span>
              </div>
            </div>

            {/* Action 2: Direct Reset Form */}
            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.newPassword')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 rounded transition-colors cursor-pointer focus:outline-none"
                    aria-label={showNewPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    title={showNewPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-500 hover:text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.confirmPassword')}
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 rounded transition-colors cursor-pointer focus:outline-none"
                    aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    title={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-500 hover:text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{loading ? 'Updating...' : t('auth.updatePasswordBtn')}</span>
              </button>
            </form>
          </div>
        ) : (
          /* LOGIN & REGISTER VIEW */
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            {mode === 'login' && !isSupabaseConnected && (
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Quick Test Accounts:</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Password: password123</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('alex@teiln.app');
                      setPassword('password123');
                      setError(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-[11px] text-left transition-colors cursor-pointer"
                  >
                    <div className="font-semibold text-emerald-400">Alex Rivera</div>
                    <div className="text-[10px] text-slate-400 truncate">alex@teiln.app</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('clara@teiln.app');
                      setPassword('password123');
                      setError(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-[11px] text-left transition-colors cursor-pointer"
                  >
                    <div className="font-semibold text-emerald-400">Clara Vance</div>
                    <div className="text-[10px] text-slate-400 truncate">clara@teiln.app</div>
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.fullName')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jordan Smith"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  {t('auth.password')}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer font-medium"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 rounded transition-colors cursor-pointer focus:outline-none"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-500 hover:text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-semibold text-xs shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              {loading ? '...' : mode === 'login' ? t('auth.signInButton') : t('auth.createButton')}
            </button>

            <button
              type="button"
              onClick={handleSendMagicLink}
              disabled={magicLoading}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-white font-medium text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{magicLoading ? 'Sending link...' : 'Email me a Magic Link (Passwordless)'}</span>
            </button>
          </form>
        )}

        {/* Instant Guest Mode Option (Only shown in login / register modes) */}
        {mode !== 'forgot' && (
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400 mb-2.5">
              Testing or joining quickly without an account?
            </p>
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={guestLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{guestLoading ? 'Starting guest session...' : 'Continue as Guest (No Password Required)'}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
